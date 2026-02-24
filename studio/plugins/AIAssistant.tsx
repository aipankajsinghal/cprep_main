import React, { useState, useEffect } from 'react'
import { definePlugin, useFormValue, useClient, setIfMissing, insert, set } from 'sanity'
import { SparklesIcon, DocumentTextIcon } from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'

// Env var must be set in studio/.env as SANITY_STUDIO_SITE_URL=http://localhost:4321
const SITE_URL = (process.env.SANITY_STUDIO_SITE_URL ?? '').replace(/\/$/, '')

/**
 * Formats error messages for display
 */
function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Handles API calls with error extraction
 */
async function callAIEndpoint(endpoint: string, payload: any): Promise<any> {
  console.log(`[AI Assistant] Calling endpoint: ${endpoint}`);
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      console.error(`[AI Assistant] API Error (${res.status}):`, errorData);
      throw new Error(errorData.error || `API error: ${res.status}`);
    }

    return await res.json()
  } catch (fetchErr) {
    console.error(`[AI Assistant] Fetch failed:`, fetchErr);
    throw fetchErr;
  }
}

function AIAssistantTool() {
  const documentId = useFormValue(['_id']) as string | undefined
  const docType = useFormValue(['_type']) as string | undefined
  const title = useFormValue(['title']) as string | undefined
  const body = useFormValue(['body']) as string | undefined
  const currentQuiz = useFormValue(['quiz', 'questions']) as any[] | undefined

  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()

  const [loadingSeo, setLoadingSeo] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)

  useEffect(() => {
    console.log('[AI Assistant] Initialized with SITE_URL:', SITE_URL || '(empty)');
    if (!SITE_URL) {
      console.warn('[AI Assistant] SANITY_STUDIO_SITE_URL is not set. AI features will not work.');
    }
  }, []);

  // We need to resolve the document ID correctly for patching drafts
  const resolvedDocId = documentId?.replace('drafts.', '')

  // The assistant depends on a frontend API hosted on the public site.
  // If `SANITY_STUDIO_SITE_URL` is not set, generation requests will fail
  // because the generative API key is expected to live on the frontend deployment.
  const SITE_URL_CONFIGURED = SITE_URL && SITE_URL.length > 0

  if (docType !== 'post') return null

  const handleGenerateSEO = async () => {
    if (!title && !body) {
      toast.push({ status: 'warning', title: 'Need text', description: 'Please provide at least a title or body text.' })
      return
    }

    setLoadingSeo(true)
    try {
      if (!SITE_URL_CONFIGURED) {
        toast.push({
          status: 'error',
          title: 'Site URL not configured',
          description: 'Set SANITY_STUDIO_SITE_URL to your public site URL so the Studio can call the /api/ai endpoints.'
        })
        return
      }

      const data = await callAIEndpoint(`${SITE_URL}/api/ai/seo-description/`, { title, body })

      if (data.description && resolvedDocId) {
        // Patch the current document
        await client
          .patch(`drafts.${resolvedDocId}`)
          .setIfMissing({ description: '' })
          .set({ description: data.description })
          .commit()

        toast.push({ status: 'success', title: 'SEO Description Generated!' })
      } else {
        throw new Error(data.error || 'No description returned')
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err)
      console.error('SEO Generation Error:', errorMessage)
      toast.push({ status: 'error', title: 'Generation failed', description: errorMessage })
    } finally {
      setLoadingSeo(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!title && !body) {
      toast.push({ status: 'warning', title: 'Need text', description: 'Please provide at least a title or body text.' })
      return
    }

    setLoadingQuiz(true)
    try {
      if (!SITE_URL_CONFIGURED) {
        toast.push({
          status: 'error',
          title: 'Site URL not configured',
          description: 'Set SANITY_STUDIO_SITE_URL to your public site URL so the Studio can call the /api/ai endpoints.'
        })
        return
      }

      const data = await callAIEndpoint(`${SITE_URL}/api/ai/generate-quiz/`, { title, body })

      if (data.questions && data.questions.length > 0 && resolvedDocId) {
        // Let's add Sanity keys to the questions format
        const formattedQuestions = data.questions.map((q: any) => ({
          ...q,
          _key: crypto.randomUUID(),
          _type: 'quizQuestion'
        }))

        // Patch the current document
        await client
          .patch(`drafts.${resolvedDocId}`)
          .setIfMissing({ quiz: { title: 'AI Generated Quiz', mode: 'practice', questions: [] } })
          .set({ 'quiz.questions': formattedQuestions })
          .commit()

        toast.push({ status: 'success', title: 'Quiz Generated!', description: `Added ${formattedQuestions.length} questions.` })
      } else {
        throw new Error(data.error || 'No questions returned or invalid format')
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err)
      console.error('Quiz Generation Error:', errorMessage)
      toast.push({ status: 'error', title: 'Generation failed', description: errorMessage })
    } finally {
      setLoadingQuiz(false)
    }
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="primary">
      <Stack space={4}>
        <Flex gap={2} align="center">
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <SparklesIcon />
          </Box>
          <Heading size={1}>AI Content Assistant</Heading>
        </Flex>
        <Text size={1} muted>
          Use Gemini AI to analyze your post and generate metadata or quizzes instantly.
        </Text>
        <Flex gap={3} wrap="wrap">
          <Button
            fontSize={1}
            padding={3}
            mode="ghost"
            icon={DocumentTextIcon}
            text="Generate SEO Description"
            onClick={handleGenerateSEO}
            disabled={loadingSeo || !resolvedDocId}
            loading={loadingSeo}
          />
          <Button
            fontSize={1}
            padding={3}
            mode="ghost"
            icon={SparklesIcon}
            text="Generate 5-Q Quiz"
            onClick={handleGenerateQuiz}
            disabled={loadingQuiz || !resolvedDocId}
            loading={loadingQuiz}
          />
        </Flex>
      </Stack>
    </Card>
  )
}

// We'll expose this as a document action, or just a component that can be added to the structure
// For simplicity in Sanity Studio v3, a cleaner way is to add it to the document inspector or form components.
// Here we are creating a raw plugin that injects a form component wrapper.

export const aiAssistantPlugin = definePlugin({
  name: 'ai-assistant',
  form: {
    components: {
      input: (props) => {
        // If it's the root document object for a post, render the assistant above it
        if (props.id === 'root' && props.schemaType.name === 'post') {
          return (
            <Stack space={4}>
              <AIAssistantTool />
              {props.renderDefault(props)}
            </Stack>
          )
        }
        return props.renderDefault(props)
      },
    },
  },
})
