import {
    Entity,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    OneToMany,
} from "typeorm";
import { Episodes } from "../episodes/episodes.entity";

@Entity()
export class Characters extends BaseEntity {
    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Episodes, (episode) => episode.character)
    episodes: Episodes[];

    @Column({ nullable: true })
    planet?: string;
}
