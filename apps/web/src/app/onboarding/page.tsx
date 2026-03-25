"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { GradientButton } from "@/components/ui/GradientButton";
import { api } from "@/lib/api";

interface Artist {
  id: string;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
  subscriberCount: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<Artist[]>("/artists?limit=30")
      .then(setArtists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      for (const artistId of selected) {
        await api("/subscriptions", {
          method: "POST",
          body: JSON.stringify({ artistId }),
        });
      }
      router.replace("/");
    } catch {
      setSubmitting(false);
    }
  };

  const filtered = query
    ? artists.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.nameEn?.toLowerCase().includes(query.toLowerCase())
      )
    : artists;

  return (
    <section className="pt-8 pb-32">
      <Container>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="text-center">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-manrope)]">
              당신만의 경험을 큐레이팅하세요
            </h1>
            <p className="text-sm text-on-surface-variant mt-2">
              좋아하는 아티스트를 선택하면 맞춤 공연 알림을 보내드립니다
            </p>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="아티스트 검색"
              className="w-full bg-surface-lowest rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 아티스트 그리드 */}
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-surface-low" />
                  <div className="h-3 w-12 bg-surface-low rounded mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((artist) => {
                const isSelected = selected.has(artist.id);
                return (
                  <button
                    key={artist.id}
                    onClick={() => toggle(artist.id)}
                    className="flex flex-col items-center text-center py-2"
                  >
                    <div className="relative">
                      <AvatarCircle
                        src={artist.imageUrl}
                        name={artist.name}
                        size="lg"
                        className={isSelected ? "ring-2 ring-black ring-offset-2" : ""}
                      />
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium mt-2 truncate max-w-[80px]">
                      {artist.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Container>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass p-4 pb-safe">
        <div className="max-w-[720px] mx-auto">
          <GradientButton
            onClick={handleSubmit}
            fullWidth
            disabled={selected.size === 0 || submitting}
          >
            {submitting
              ? "설정 중..."
              : selected.size > 0
                ? `큐레이팅 완료 → ${selected.size}명 선택`
                : "아티스트를 선택해주세요"}
          </GradientButton>
        </div>
      </div>
    </section>
  );
}
