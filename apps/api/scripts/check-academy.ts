import {
  ACADEMY_ENTRIES,
  findBrokenAcademyLinks,
} from '../src/modules/academy/academy-content.js';
import { searchAcademy } from '../src/modules/academy/academy-search.js';

const broken = findBrokenAcademyLinks();
console.log(`Articles: ${ACADEMY_ENTRIES.length}`);
console.log(
  broken.length ? `Broken links:\n${broken.join('\n')}` : 'No broken links',
);

for (const query of process.argv.slice(2)) {
  console.log(`\n> ${query}`);
  for (const result of searchAcademy(query, 3)) {
    console.log(`  ${result.score}  ${result.section?.url ?? result.url}`);
  }
}
