import { Artist } from "../../domain/artist.entity";

export interface ICreateArtistUseCase{
    execute(name:string):Promise<Artist>
}