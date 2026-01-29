'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type JobStatus = 'idle' | 'generating' | 'complete' | 'error';

interface Job {
  id: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  videoUrl?: string;
  error?: string;
}

export default function Home() {
  const router = useRouter();
  const [script, setScript] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [mediaType, setMediaType] = useState('ai-video');
  const [preset, setPreset] = useState('Default');
  const [voice, setVoice] = useState('Narrator (Female)');
  const [job, setJob] = useState<Job | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      alert('Please enter a script');
      return;
    }

    setJob({ id: '', status: 'generating', message: 'Starting generation...' });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          aspectRatio,
          mediaType,
          preset,
          voice,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setJob({
          id: data.jobId,
          status: 'generating',
          message: data.message || 'Processing...',
        });

        // Poll for status if we have a job ID
        if (data.jobId) {
          pollJobStatus(data.jobId);
        }
      } else {
        setJob({
          id: '',
          status: 'error',
          error: data.error || 'Failed to start generation',
        });
      }
    } catch (error) {
      setJob({
        id: '',
        status: 'error',
        error: 'Network error. Is the pipeline server running?',
      });
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();

        if (data.status === 'complete') {
          clearInterval(interval);
          setJob({
            id: jobId,
            status: 'complete',
            videoUrl: data.videoUrl,
            message: 'Video ready!',
          });
        } else if (data.status === 'error') {
          clearInterval(interval);
          setJob({
            id: jobId,
            status: 'error',
            error: data.error,
          });
        } else {
          setJob({
            id: jobId,
            status: 'generating',
            progress: data.progress,
            message: data.message,
          });
        }
      } catch {
        // Keep polling on network errors
      }
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          <span className="text-xl font-bold text-white">Cinematic</span>
        </div>
        
        <Button className="w-full mb-6 bg-violet-600 hover:bg-violet-700">
          + Create New Video
        </Button>
        
        <nav className="space-y-1 flex-1">
          {[
            { icon: '🏠', label: 'Home', active: true },
            { icon: '📊', label: 'Stats' },
            { icon: '🎬', label: 'Videos' },
            { icon: '📤', label: 'Exports' },
            { icon: '🤖', label: 'Auto-Mode' },
            { icon: '👤', label: 'Characters' },
            { icon: '✨', label: 'Generation' },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.active 
                  ? 'text-white bg-zinc-800' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="pt-4 border-t border-zinc-800 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create a new video</h1>
            <p className="text-zinc-400">Select a tool and pick your options to create your video.</p>
          </div>

          {/* Tool Tabs */}
          <Tabs defaultValue="script" className="mb-8">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="prompt" className="data-[state=active]:bg-zinc-800">
                ✏️ Prompt to Video
              </TabsTrigger>
              <TabsTrigger value="script" className="data-[state=active]:bg-zinc-800">
                📝 Script to Video
              </TabsTrigger>
              <TabsTrigger value="article" className="data-[state=active]:bg-zinc-800">
                📄 Article to Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="mt-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="text-2xl">📝</span> Script to Video
                  </CardTitle>
                  <CardDescription>
                    Create a vertical video from a script. Choose your media preferences, voice, and music.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Script Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-300">Your video narrator script</label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
                          Rewrite
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          Script Generator
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Enter your script exactly as you want it spoken, or paste a URL to import content..."
                      className="min-h-32 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                    />
                    <div className="flex justify-between mt-2 text-sm text-zinc-500">
                      <span>Number of words: {script.split(/\s+/).filter(Boolean).length}</span>
                      <span>Estimated duration: {Math.ceil(script.split(/\s+/).filter(Boolean).length / 2.5)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">✏️ Prompt to Video</CardTitle>
                  <CardDescription>Describe what you want and AI will generate the script and video.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input 
                    placeholder="A dramatic scene of a ninja battle in the rain..." 
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="article">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">📄 Article to Video</CardTitle>
                  <CardDescription>Paste a URL or article text to convert into a video.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input 
                    placeholder="https://example.com/article" 
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Aspect Ratio */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Aspect Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {[
                    { value: '9:16', label: 'Portrait', icon: '📱' },
                    { value: '16:9', label: 'Landscape', icon: '🖥️' },
                    { value: '1:1', label: 'Square', icon: '⬜' },
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value as typeof aspectRatio)}
                      className={`flex-1 p-4 rounded-lg border transition-colors ${
                        aspectRatio === ratio.value
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">{ratio.icon}</div>
                      <div className="text-sm text-white">{ratio.label}</div>
                      <div className="text-xs text-zinc-500">{ratio.value}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Media Type */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Media Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {[
                    { value: 'ai-video', label: 'AI Video', desc: 'Generate unique clips' },
                    { value: 'ai-images', label: 'AI Images', desc: 'With motion effects' },
                    { value: 'stock', label: 'Stock', desc: 'High-quality footage' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setMediaType(type.value)}
                      className={`flex-1 p-4 rounded-lg border transition-colors ${
                        mediaType === type.value
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-sm text-white font-medium">{type.label}</div>
                      <div className="text-xs text-zinc-500 mt-1">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Style Preset */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Generation Preset</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {['Default', 'Ghibli Studio', 'Cinematic', 'Anime', 'Pixar', 'Documentary'].map((p) => (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      onClick={() => setPreset(p)}
                      className={`border-zinc-700 ${
                        preset === p 
                          ? 'border-violet-500 bg-violet-500/10 text-white' 
                          : 'text-zinc-300 hover:border-violet-500'
                      }`}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voice */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Voice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {['Narrator (Male)', 'Narrator (Female)', 'Dramatic', 'Calm', 'Energetic'].map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      onClick={() => setVoice(v)}
                      className={`border-zinc-700 ${
                        voice === v 
                          ? 'border-violet-500 bg-violet-500/10 text-white' 
                          : 'text-zinc-300 hover:border-violet-500'
                      }`}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 px-12"
              onClick={handleGenerate}
              disabled={job?.status === 'generating'}
            >
              {job?.status === 'generating' ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>🎬 Generate Video</>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Preview Panel */}
      <aside className="w-80 border-l border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Output Preview</h2>
        
        <div className="aspect-[9/16] bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden">
          {job?.status === 'complete' && job.videoUrl ? (
            <video 
              src={job.videoUrl} 
              controls 
              className="w-full h-full object-cover"
            />
          ) : job?.status === 'generating' ? (
            <div className="text-center text-zinc-400 p-4">
              <div className="text-4xl mb-4 animate-pulse">🎬</div>
              <div className="text-sm mb-2">{job.message || 'Generating...'}</div>
              {job.progress !== undefined && (
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                  <div 
                    className="bg-violet-500 h-2 rounded-full transition-all"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : job?.status === 'error' ? (
            <div className="text-center text-red-400 p-4">
              <div className="text-4xl mb-2">❌</div>
              <div className="text-sm">{job.error}</div>
            </div>
          ) : (
            <div className="text-center text-zinc-500">
              <div className="text-4xl mb-2">🎥</div>
              <div className="text-sm">Preview will appear here</div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="text-sm text-zinc-400">Estimated cost</div>
          <div className="text-lg font-bold text-white">10 credits</div>
        </div>

        {job?.status === 'complete' && job.videoUrl && (
          <Button 
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => window.open(job.videoUrl, '_blank')}
          >
            ⬇️ Download Video
          </Button>
        )}
      </aside>
    </div>
  );
}
