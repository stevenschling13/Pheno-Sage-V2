import { Database, Loader2 } from 'lucide-react';
import { MediaAsset, toJsDate } from '../../types';

interface Props {
  media: Array<MediaAsset & { url?: string }>;
}

export function MediaHistoryGrid({ media }: Props) {
  const images = media.filter((m) => m.mediaType === 'image');

  return (
    <div className="border border-brand-border bg-brand-surface/20">
      <div className="flex items-center gap-2 border-b border-brand-border bg-brand-bg p-3">
        <Database className="w-4 h-4 text-zinc-500" />
        <span className="data-label text-zinc-300">Phase.4 Visual Cache History</span>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-bg">
        {images.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest border border-dashed border-zinc-800">
            Null Image Vector
          </div>
        ) : (
          images.map((item) => {
            const date = toJsDate(item.createdAt);
            return (
              <div
                key={item.id}
                className="aspect-square bg-zinc-900 border border-brand-border relative overflow-hidden group"
              >
                {item.url ? (
                  <img
                    src={item.url}
                    alt="Plant"
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center border border-dashed border-zinc-800 text-zinc-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                <div className="absolute top-1 right-1 bg-black/60 px-1 py-0.5 text-[8px] text-zinc-300 uppercase tracking-widest border border-zinc-700/50 backdrop-blur-md">
                  {date
                    ? date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })
                    : ''}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
