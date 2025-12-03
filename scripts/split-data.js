/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../raw-data/questions.json');
const publicDataDir = path.join(__dirname, '../public/data');
const papersDir = path.join(publicDataDir, 'papers');

// Ensure directories exist
if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
}
if (!fs.existsSync(papersDir)) {
    fs.mkdirSync(papersDir, { recursive: true });
}

// Read source data
const questions = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// 1. Create Index (Lightweight)
const indexData = questions.map(q => ({
    id: q.id,
    paperId: q.paperId,
    number: q.number,
    type: q.type,
    tags: q.tags
}));

fs.writeFileSync(path.join(publicDataDir, 'index.json'), JSON.stringify(indexData, null, 2));
console.log(`Generated index.json with ${indexData.length} items.`);

// 2. Create Paper Details
const papers = {};
questions.forEach(q => {
    if (!papers[q.paperId]) {
        papers[q.paperId] = {
            paperId: q.paperId,
            questions: {}
        };
    }
    papers[q.paperId].questions[q.id] = q;
});

Object.values(papers).forEach(paper => {
    const filePath = path.join(papersDir, `${paper.paperId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(paper, null, 2));
    console.log(`Generated ${paper.paperId}.json`);
});

console.log('Data split complete.');
