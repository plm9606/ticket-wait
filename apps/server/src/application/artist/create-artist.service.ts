import { Artist } from "../../domain/artist.entity";
import { ICreateArtistUseCase } from "../../ports/in/create-artist.use-case";
import { IArtistRepository } from "../../ports/out/artist.port";
import { IImageEnrichmentPort } from "../../ports/out/image-enrichment.port";
import { IMusicBrainzPort, MBArtist } from "../../ports/out/musicbrainz.port";

export class CreateArtistService implements ICreateArtistUseCase {
  constructor(
    private artistRepository: IArtistRepository,
    private imageEnrichment: IImageEnrichmentPort,
    private musicbrainz: IMusicBrainzPort
  ) {}

  private static mapMBArtist(mb: MBArtist): {
    musicbrainzId: string;
    name: string;
    nameEn: string | null;
    aliases: string[];
  } {
    const aliases = mb.aliases ?? [];

    const koAliases = aliases.filter((a) => a.locale === "ko");
    const primaryKo = koAliases.find((a) => a.primary);
    const koName = primaryKo?.name ?? koAliases[0]?.name ?? null;

    const enAliases = aliases.filter((a) => a.locale === "en");
    const primaryEn = enAliases.find((a) => a.primary);
    const enName = primaryEn?.name ?? enAliases[0]?.name ?? mb.name;

    const name = koName ?? mb.name;
    const nameEn = enName !== name ? enName : null;

    const usedNames = new Set([name, nameEn, mb.name].filter(Boolean));
    const remainingAliases = aliases
      .map((a) => a.name)
      .filter((n) => !usedNames.has(n));

    return {
      musicbrainzId: mb.id,
      name,
      nameEn,
      aliases: [...new Set(remainingAliases)],
    };
  }

  async execute(name: string): Promise<Artist> {
    const results = await this.musicbrainz.searchByKeyword(name, 10);
    const best = results[0];

    const mapped = best
      ? CreateArtistService.mapMBArtist(best)
      : { musicbrainzId: null as unknown as string, name, nameEn: null, aliases: [] };

    const musicbrainzId = best ? mapped.musicbrainzId : null;

    if (musicbrainzId) {
      const existing = await this.artistRepository.findByMusicbrainzId(musicbrainzId);
      if (existing) {
        console.log(`[CreateArtistService] musicbrainzId 중복, 기존 아티스트 반환 (name=${existing.name}, id=${existing.id})`);
        return existing;
      }
    }

    let imageData: { appleMusicId: number | null; imageUrl: string | null } = {
      appleMusicId: null,
      imageUrl: null,
    };
    console.log(`[CreateArtistService] 이미지 조회 시작 (name=${mapped.name})`);
    try {
      imageData = await this.imageEnrichment.fetchImageData({
        name: mapped.name,
        nameEn: mapped.nameEn,
        aliases: mapped.aliases,
        musicbrainzId,
      });
      console.log(`[CreateArtistService] 이미지 조회 완료 (name=${mapped.name}, imageUrl=${imageData.imageUrl ?? "없음"})`);
    } catch (err) {
      console.error(`[CreateArtistService] 이미지 fetch 실패 (name=${mapped.name})`, err);
    }

    return this.artistRepository.create({
      name: mapped.name,
      nameEn: mapped.nameEn,
      aliases: mapped.aliases,
      musicbrainzId,
      appleMusicId: imageData.appleMusicId,
      imageUrl: imageData.imageUrl,
    });
  }
}
