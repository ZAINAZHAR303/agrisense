"use client";

import { useMessages } from "@/hooks";
import { Header } from "@/components/common";
import { ChatMessages, ChatInput } from "./components";

export default function AssistantContent() {
  const { messages, input, loading, messagesEndRef, setInput, sendMessage, handleKeyPress } = useMessages();

  return (
    <div className="flex flex-col h-screen max-h-[calc(100vh-120px)] space-y-10 px-4 sm:px-6 lg:px-8 py-10 bg-green-50 dark:bg-gray-900">
      <Header
        title="AgriSense AI Assistant"
        subtitle="Get smart, context-aware agricultural advice instantly"
      />

      <main className="flex-1 flex flex-col mt-6">
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={() => sendMessage()}
          onKeyPress={(e) => handleKeyPress(e)}
          loading={loading}
        />
      </main>

      <footer className="text-center py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
        AgriSense AI Assistant is here to help. Ask anything related to farming!
      </footer>
    </div>
  );
}
