import {
    Entity,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    ManyToOne,
} from "typeorm";
import { Characters } from "../characters/characters.entity";

@Entity()
export class Episodes extends BaseEntity {
    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Characters, (character) => character.episodes, {
        cascade: true,
        onDelete: "CASCADE" 
    })
    character: Characters;
}
