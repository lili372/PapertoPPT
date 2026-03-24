"""LLM调用封装 - 支持Minimax API"""
import os
from typing import Optional
from openai import OpenAI
from .config import MINIMAX_API_KEY, MINIMAX_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS


class LLMClient:
    """Minimax API封装"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or MINIMAX_API_KEY
        self.model = MINIMAX_MODEL
        self.temperature = LLM_TEMPERATURE
        self.max_tokens = LLM_MAX_TOKENS
        self._client: Optional[OpenAI] = None

    @property
    def client(self) -> OpenAI:
        """延迟初始化客户端"""
        if self._client is None:
            if not self.api_key:
                raise ValueError("MINIMAX_API_KEY未设置")
            self._client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.minimax.chat/v1"
            )
        return self._client

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        """生成文本"""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature
        )

        return response.choices[0].message.content


# 全局单例
llm_client = LLMClient()


def get_llm_client() -> LLMClient:
    """获取LLM客户端实例"""
    return llm_client
