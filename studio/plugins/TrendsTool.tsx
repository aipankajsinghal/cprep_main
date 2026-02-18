import React, { useState } from 'react'
import { useClient, definePlugin } from 'sanity'
import { IntentLink } from 'sanity/router'
import { SparklesIcon } from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  Badge,
} from '@sanity/ui'

interface Trend {
  topic: string
  why_it_matters: string
  suggested_angle: string
  suggested_cluster: string
}

interface CreatedDoc {
  id: string
  title: string
}

// Env var must be set in studio/.env as SANITY_STUDIO_SITE_URL=https://www.championsprep.in
const SITE_URL = (process.env.SANITY_STUDIO_SITE_URL ?? '').replace(/\/$/, '')

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96)
}

function TrendsTool() {
  const client = useClient({ apiVersion: '2024-01-01' })

  const [trends, setTrends] = useState<Trend[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [createdDoc, setCreatedDoc] = useState<CreatedDoc | null>(null)

  const fetchTrends = async () => {
    setLoading(true)
    setStatus('Fetching trends...')
    setTrends([])
    setCreatedDoc(null)
    try {
      const res = await fetch(`${SITE_URL}/api/trends`)
      if (!res.ok) throw new Error('Trends fetch failed')
      const data = await res.json()
      const items: Trend[] = data.items ?? []
      setTrends(items)
      setStatus(
        items.length
          ? `Found ${items.length} trending topics`
          : 'No commerce-relevant trends found right now.'
      )
    } catch {
      setStatus('Failed to fetch trends. Ensure SANITY_STUDIO_SITE_URL is set correctly.')
    } finally {
      setLoading(false)
    }
  }

  const generateDraft = async (trend: Trend) => {
    setGenerating(trend.topic)
    setStatus(`Generating draft for "${trend.topic}"...`)
    setCreatedDoc(null)
    try {
      const res = await fetch(`${SITE_URL}/api/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trend.topic,
          angle: trend.suggested_angle,
          cluster: trend.suggested_cluster,
        }),
      })
      if (!res.ok) throw new Error('Draft generation failed')
      const draft = await res.json()

      const doc = await client.create({
        _type: 'post',
        title: draft.title,
        slug: { _type: 'slug', current: slugify(draft.title) },
        description: draft.description,
        body: draft.body,
        tags: draft.tags,
        cluster: trend.suggested_cluster,
        draft: true,
        author: 'ChampionsPrep',
        date: new Date().toISOString(),
      })

      setCreatedDoc({ id: doc._id, title: draft.title })
      setStatus(`Draft saved to Sanity: "${draft.title}"`)
    } catch (err) {
      setStatus('Failed to generate or save draft. Check the console for details.')
      console.error(err)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <Box padding={5}>
      <Stack space={5}>
        <Stack space={2}>
          <Heading size={2}>Trends Desk</Heading>
          <Text size={1} muted>
            Discover trending commerce topics and generate AI drafts saved directly into Sanity.
          </Text>
        </Stack>

        <Flex gap={3} align="center" wrap="wrap">
          <Button
            icon={SparklesIcon}
            text="Discover Trending Topics"
            tone="primary"
            onClick={fetchTrends}
            disabled={loading || generating !== null}
          />
          {loading && <Spinner />}
          {status && (
            <Text size={1} muted>
              {status}
            </Text>
          )}
        </Flex>

        {createdDoc && (
          <Card tone="positive" padding={4} radius={2}>
            <Flex gap={2} align="center" wrap="wrap">
              <Text size={1} weight="semibold">
                Draft created —
              </Text>
              <IntentLink intent="edit" params={{ id: createdDoc.id, type: 'post' }}>
                <Text size={1} style={{ textDecoration: 'underline' }}>
                  {createdDoc.title}
                </Text>
              </IntentLink>
            </Flex>
          </Card>
        )}

        <Stack space={3}>
          {trends.map((trend) => (
            <Card key={trend.topic} padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <Stack space={2} flex={1}>
                    <Text weight="semibold" size={2}>
                      {trend.topic}
                    </Text>
                    <Badge tone="primary" size={1} style={{ width: 'fit-content' }}>
                      {trend.suggested_cluster}
                    </Badge>
                  </Stack>
                </Flex>

                <Text size={1} muted>
                  <strong>Why it matters:</strong> {trend.why_it_matters}
                </Text>
                <Text size={1} muted>
                  <strong>Suggested angle:</strong> {trend.suggested_angle}
                </Text>

                <Box>
                  <Button
                    text={generating === trend.topic ? 'Generating...' : 'Generate & Save Draft'}
                    tone="default"
                    disabled={generating !== null}
                    onClick={() => generateDraft(trend)}
                  />
                </Box>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

export const trendsPlugin = definePlugin({
  name: 'trends-tool',
  tools: [
    {
      name: 'trends',
      title: 'Trends',
      icon: SparklesIcon,
      component: TrendsTool,
    },
  ],
})
