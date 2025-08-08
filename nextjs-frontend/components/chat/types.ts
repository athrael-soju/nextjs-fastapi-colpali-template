export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  images?: string[]
  totalRetrieved?: number
  error?: boolean
}

export interface RetrievedImage {
  url: string
  name: string
}

export interface ChatSettings {
  topK: number
}

export interface ChatProps {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  settings: ChatSettings
}
