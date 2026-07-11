// ─── API layer for all repository operations ──────────────────
// Encapsulates fetch calls + loading/error state so App stays clean.

import { useState, useCallback } from 'react';

export function useRepoApi() {
  const [apiLoading, setApiLoading]   = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  // ── Helper to build auth & key headers dynamically ─────────
  const getHeaders = useCallback((isJson = true) => {
    const token = localStorage.getItem('repograph_auth_token');
    const headers = {};

    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Include Bring Your Own Key headers if available
    headers['x-gemini-key'] = localStorage.getItem('repograph_gemini_api_key') || '';
    headers['x-openai-key'] = localStorage.getItem('repograph_openai_api_key') || '';
    headers['x-anthropic-key'] = localStorage.getItem('repograph_anthropic_api_key') || '';
    headers['x-llm-provider'] = localStorage.getItem('repograph_llm_provider') || '';

    return headers;
  }, []);

  // ── Analyze a new repository URL ──────────────────────────
  const analyzeRepo = useCallback(async (gitUrl, forceRefresh, branch) => {
    if (!gitUrl?.trim()) return null;
    setErrorMsg('');
    setApiLoading(true);
    try {
      const res  = await fetch('/api/repos/analyze', {
        method:  'POST',
        headers: getHeaders(true),
        body:    JSON.stringify({ gitUrl, forceRefresh, branch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze repository');
      
      let credits = undefined;
      // If the server offloaded the cloning to a background job, poll until it finishes
      if (res.status === 202 && data.jobId) {
        credits = data.credits;
        const jobId = data.jobId;
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const pollRes = await fetch(`/api/jobs/${jobId}`, {
            headers: getHeaders(false),
          });
          const pollData = await pollRes.json();
          
          if (!pollRes.ok) {
            throw new Error(pollData.error || 'Failed to get analysis progress');
          }
          
          if (pollData.status === 'completed') {
            return { repository: pollData.repository, nodes: pollData.nodes, credits };
          }
          
          if (pollData.status === 'failed') {
            throw new Error(pollData.error || 'Repository analysis failed');
          }
        }
      }
      
      return { ...data, credits: data.credits }; // { repository, nodes, credits }
    } catch (err) {
      setErrorMsg(err.message);
      return null;
    } finally {
      setApiLoading(false);
    }
  }, [getHeaders]);

  // ── Load a saved repository by ID ─────────────────────────
  const loadRepo = useCallback(async (repoId) => {
    setErrorMsg('');
    setApiLoading(true);
    try {
      const res  = await fetch(`/api/repos/${repoId}`, {
        headers: getHeaders(false),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve repository');
      return data; // { repository, nodes }
    } catch (err) {
      setErrorMsg(err.message);
      return null;
    } finally {
      setApiLoading(false);
    }
  }, [getHeaders]);

  // ── Fetch remote branches list for a repo ─────────────────
  const fetchBranches = useCallback(async (repoId) => {
    try {
      const res = await fetch(`/api/repos/${repoId}/branches`, {
        headers: getHeaders(false),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
    return ['main'];
  }, [getHeaders]);

  // ── Fetch all previously analyzed repos ───────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/repos', {
        headers: getHeaders(false),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Failed to load history:', err);
    }
    return [];
  }, [getHeaders]);

  // ── Send a chat message ────────────────────────────────────
  const sendChatMessage = useCallback(async (repoId, question, chatHistory) => {
    setChatLoading(true);
    try {
      const res  = await fetch(`/api/repos/${repoId}/chat`, {
        method:  'POST',
        headers: getHeaders(true),
        body:    JSON.stringify({ question, chatHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get chat response');
      return data.answer;
    } catch (err) {
      throw err; // caller handles UI message
    } finally {
      setChatLoading(false);
    }
  }, [getHeaders]);

  return {
    apiLoading, chatLoading, errorMsg, setErrorMsg,
    analyzeRepo, loadRepo, fetchBranches, fetchHistory, sendChatMessage,
  };
}
