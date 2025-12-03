const fs = require('fs');
const path = require('path');

const videoDir = "C:\\Users\\u0182754\\OneDrive - KU Leuven\\SCIVIS\\Scraping_test\\Youtube_Scraper\\Edited videos";
const baseURL = "https://lingering-cloud-f458.jonathanadams02.workers.dev";

// Mapping for _arrow folders to cloud _Annotation folders
const arrowFolderMapping = {
    "Ambiguous_Person_negative_scene_arrow": "Ambiguous_Person_Negative_Scene_Annotation",
    "Ambiguous_Person_positive_scene_arrow": "Ambiguous_Person_Positive_Scene_Annotation",
    "Congruent Negative_arrow": "Congruent_Negative_Annotation",
    "Congruent Positive_arrow": "Congruent_Positive_Annotation",
    "Incongruent_Neg_Scene_Pos_People_arrow": "Incongruent_Neg_Scene_Pos_Person_Annotation",
    "Incongruent_Pos_Scene_Neg_People_arrow": "Incongruent_Pos_Scene_Neg_Person_Annotation"
};

// Mapping for original folders (local name to cloud name)
const originalFolderMapping = {
    "Ambiguous_Person_negative_scene": "Ambiguous_Person_Negative_Scene",
    "Ambiguous_Person_positive_scene": "Ambiguous_Person_Positive_Scene",
    "Congruent Negative": "Congruent_Negative",
    "Congruent Positive": "Congruent_Positive",
    "Incongruent_Neg_Scene_Pos_People": "Incongruent_Neg_Scene_Pos_Person",
    "Incongruent_Pos_Scene_Neg_People": "Incongruent_Pos_Scene_Neg_Person"
};

function getAllVideos(dir) {
    let videos = [];
    
    const folders = fs.readdirSync(dir);
    
    folders.forEach(folder => {
        const folderPath = path.join(dir, folder);
        
        if (fs.statSync(folderPath).isDirectory() && folder !== '_multi_annotation') {
            const files = fs.readdirSync(folderPath);
            
            // Determine which mapping to use
            let mappedFolder;
            
            if (folder.endsWith('_arrow')) {
                // This is an annotated folder - map to _Annotation
                mappedFolder = arrowFolderMapping[folder];
            } else {
                // This is an original folder - map to original cloud name
                mappedFolder = originalFolderMapping[folder];
            }
            
            if (mappedFolder) {
                files.forEach(file => {
                    if (file.endsWith('.mp4')) {
                        videos.push({
                            folder: mappedFolder,
                            filename: file,
                            url: `${baseURL}/${mappedFolder}/${file}`
                        });
                    }
                });
            } else {
                console.warn(`Warning: No mapping for folder "${folder}"`);
            }
        }
    });
    
    return videos;
}

const allVideos = getAllVideos(videoDir);

// Sort videos by folder and filename
allVideos.sort((a, b) => {
    if (a.folder === b.folder) {
        return a.filename.localeCompare(b.filename);
    }
    return a.folder.localeCompare(b.folder);
});

fs.writeFileSync('video-list.json', JSON.stringify(allVideos, null, 2));

console.log(`Found ${allVideos.length} videos in _arrow folders!`);
console.log('\nVideos per folder:');

// Count videos per folder
const folderCounts = {};
allVideos.forEach(video => {
    folderCounts[video.folder] = (folderCounts[video.folder] || 0) + 1;
});

Object.keys(folderCounts).sort().forEach(folder => {
    console.log(`  ${folder}: ${folderCounts[folder]} videos`);
});

console.log('\nSaved to video-list.json');