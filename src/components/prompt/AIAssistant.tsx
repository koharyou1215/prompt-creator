"use client";

import React, { useState, useEffect } from "react";

interface AIAssistantProps {
  prompt: any;
}

export function AIAssistant({ prompt }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/templates/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt?.content || "" }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to get suggestions:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (prompt?.content) {
      getSuggestions();
    }
  }, [prompt?.content]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">AI提案</h4>
        <button
          onClick={getSuggestions}
          className="text-xs text-blue-600 hover:text-blue-700"
          disabled={isLoading}>
          {isLoading ? "取得中..." : "更新"}
        </button>
      </div>

      {suggestions.length === 0 && !isLoading && (
        <div className="text-sm text-gray-500 text-center py-4">
          提案を取得するには、プロンプトを入力してください
        </div>
      )}

      {suggestions.map((suggestion, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium mb-1">{suggestion.name}</div>
          <div className="text-xs text-gray-500 mb-2">
            {suggestion.reasoning}
          </div>
          <button className="text-xs text-blue-600 hover:text-blue-700">
            適用
          </button>
        </div>
      ))}
    </div>
  );
}