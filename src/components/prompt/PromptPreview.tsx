"use client";

import React from "react";

interface PromptPreviewProps {
  prompt: any;
}

export function PromptPreview({ prompt }: PromptPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          整形済みプロンプト
        </h4>
        <div className="text-sm whitespace-pre-wrap">{prompt?.content || "内容がありません"}</div>
      </div>

      {prompt?.negativePrompt && (
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">
            ネガティブプロンプト
          </h4>
          <div className="text-sm whitespace-pre-wrap">
            {prompt.negativePrompt}
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-700 mb-2">統計情報</h4>
        <div className="text-xs space-y-1">
          <div>文字数: {prompt?.content?.length || 0}</div>
          <div>要素数: {prompt?.elements?.length || 0}</div>
          <div>更新日時: {prompt?.updatedAt ? new Date(prompt.updatedAt).toLocaleString() : "不明"}</div>
        </div>
      </div>
    </div>
  );
}