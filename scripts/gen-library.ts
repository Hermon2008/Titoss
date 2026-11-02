// Régénère src/library.json avec le moteur d'harmonie : npx tsx scripts/gen-library.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { METHODS, generate } from '../src/color';
const lib = JSON.parse(readFileSync('src/library.json', 'utf8')) as { name: string; colors: string[] }[];
const ms = [METHODS[0], METHODS[3]]; // méthodes à 5 couleurs
lib.forEach((p, i) => { p.colors = generate(ms[i % 2], { h: (i * 37) % 360, s: 65, l: 50 }, 5); });
writeFileSync('src/library.json', JSON.stringify(lib));
console.log(lib[0].colors, lib[1].colors, lib[2].colors);
