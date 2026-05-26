import React from 'react'

interface SmartTextProps {
  text: string
  className?: string
}

export function SmartText({ text, className }: SmartTextProps) {
  if (!text) return null

  // Splitting by URLs using capturing group to keep the URL in the parts array
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Even indices are plain text, odd indices are URLs
        if (index % 2 === 1) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 transition-colors break-all"
              onClick={(e) => e.stopPropagation()} // Prevent clicking link from triggering parent row click/toggle
            >
              {part}
            </a>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}
