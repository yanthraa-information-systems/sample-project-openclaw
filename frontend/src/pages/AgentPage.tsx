import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Play, ChevronDown, ChevronRight, Wrench, Brain, MessageSquare } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { api } from '@/services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AgentStep {
  id: string
  step_number: number
  step_type: string
  description: string
  tool_name: string | null
  tool_input: string | null
  tool_output: string | null
  tokens_used: number
}

interface AgentRunResult {
  id: string
  input_query: string
  final_response: string | null
  status: string
  steps: AgentStep[]
  total_tokens: number
  execution_time_ms: number | null
}

const stepTypeConfig = {
  think: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  tool_call: { icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  respond: { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

function StepItem({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false)
  const config = stepTypeConfig[step.step_type as keyof typeof stepTypeConfig] || stepTypeConfig.think
  const Icon = config.icon

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-800"
      >
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white">
            Step {step.step_number}: {step.description}
          </span>
          {step.tool_name && (
            <Badge variant="warning" className="ml-2 text-[10px]">{step.tool_name}</Badge>
          )}
        </div>
        <span className="text-xs text-surface-500">{step.tokens_used} tokens</span>
        {expanded ? <ChevronDown className="h-4 w-4 text-surface-400" /> : <ChevronRight className="h-4 w-4 text-surface-400" />}
      </button>
      {expanded && (step.tool_input || step.tool_output) && (
        <div className="border-t border-surface-700 px-4 pb-4 pt-3 space-y-3">
          {step.tool_input && (
            <div>
              <p className="text-xs font-medium text-surface-400 mb-1">Input</p>
              <pre className="text-xs text-surface-300 bg-surface-900 rounded p-2 overflow-x-auto">{step.tool_input}</pre>
            </div>
          )}
          {step.tool_output && (
            <div>
              <p className="text-xs font-medium text-surface-400 mb-1">Output</p>
              <pre className="text-xs text-surface-300 bg-surface-900 rounded p-2 overflow-x-auto whitespace-pre-wrap">{step.tool_output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AgentPage() {
  const [query, setQuery] = useState('')
  const [useRag, setUseRag] = useState(true)
  const [result, setResult] = useState<AgentRunResult | null>(null)

  const runMutation = useMutation({
    mutationFn: (q: string) =>
      api.post('/agent/run', { query: q, use_rag: useRag }).then((r) => r.data),
    onSuccess: (data) => setResult(data),
  })

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    runMutation.mutate(query.trim())
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="AI Agent" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Query form */}
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15">
              <Bot className="h-4 w-4 text-brand-400" />
            </div>
            <h2 className="font-semibold text-white">Run Agent</h2>
          </div>
          <form onSubmit={handleRun} className="space-y-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a complex question... The agent will search documents, perform calculations, and reason step-by-step."
              rows={4}
              className="block w-full rounded-lg border border-surface-700 bg-surface-900 px-4 py-3 text-sm text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  className="rounded border-surface-600 bg-surface-800"
                />
                <span className="text-sm text-surface-400">Search documents (RAG)</span>
              </label>
              <Button type="submit" isLoading={runMutation.isPending} disabled={!query.trim()}>
                <Play className="h-4 w-4" /> Run Agent
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        {runMutation.isPending && <PageSpinner />}

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Steps */}
            {result.steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-surface-300">Reasoning Steps</h3>
                {result.steps.map((step) => <StepItem key={step.id} step={step} />)}
              </div>
            )}

            {/* Final response */}
            {result.final_response && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-400">Response</h3>
                  <span className="ml-auto text-xs text-surface-500">
                    {result.total_tokens} tokens · {result.execution_time_ms}ms
                  </span>
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-invert prose-sm max-w-none text-surface-100"
                >
                  {result.final_response}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
