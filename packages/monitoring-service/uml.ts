import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';
import timescaleDb from './src/datasource';

import fs from "fs";
import { join } from 'path';

const flags: Flags = {
    direction: Direction.LR,
    format: Format.PUML,
    "with-entity-names-only": true
};

const typeormUml = new TypeormUml();
typeormUml.build(timescaleDb, flags).then((puml) => {
    const filename = join(__dirname, "entities.puml");
    console.log(`Saved to ${filename}`)
    fs.writeFileSync(filename, puml)
});