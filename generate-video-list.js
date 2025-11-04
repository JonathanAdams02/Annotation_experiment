const fs = require('fs');
const path = require('path');

const videoDir = "C:\\Users\\u0182754\\OneDrive - KU Leuven\\SCIVIS\\Scraping_test\\Youtube_Scraper\\Edited videos";
const baseURL = "https://lingering-cloud-f458.jonathanadams02.workers.dev";

// Updated folder name mapping - folders end in _Annotation, not _Annotated
const folderMapping = {
    "Ambiguous_Person_negative_scene": "Ambiguous_Person_Negative_Scene",
    "Ambiguous_Person_negative_scene_outlined": "Ambiguous_Person_Negative_Scene_Annotation",
    "Ambiguous_Person_positive_scene": "Ambiguous_Person_Positive_Scene",
    "Ambiguous_Person_positive_scene_outlined": "Ambiguous_Person_Positive_Scene_Annotation",
    "Congruent Negative": "Congruent_Negative",
    "Congruent Negative_outlined": "Congruent_Negative_Annotation",
    "Congruent Positive": "Congruent_Positive",
    "Congruent Positive_outlined": "Congruent_Positive_Annotation",
    "Incongruent_Neg_Scene_Pos_People": "Incongruent_Neg_Scene_Pos_Person",
    "Incongruent_Neg_Scene_Pos_People_outlined": "Incongruent_Neg_Scene_Pos_Person_Annotation",
    "Incongruent_Pos_Scene_Neg_People": "Incongruent_Pos_Scene_Neg_Person",
    "Incongruent_Pos_Scene_Neg_People_outlined": "Incongruent_Pos_Scene_Neg_Person_Annotation"
};

function getAllVideos(dir) {
    let videos = [];
    
    const folders = fs.readdirSync(dir);
    
    folders.forEach(folder => {
        const folderPath = path.join(dir, folder);
        if (fs.statSync(folderPath).isDirectory() && folder !== '_multi_annotation') {
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
                if (file.endsWith('.mp4')) {
                    const mappedFolder = folderMapping[folder] || folder;
                    videos.push({
                        folder: mappedFolder,
                        filename: file,
                        url: `${baseURL}/${mappedFolder}/${file}`
                    });
                }
            });
        }
    });
    
    return videos;
}

const allVideos = getAllVideos(videoDir);
fs.writeFileSync('video-list.json', JSON.stringify(allVideos, null, 2));
console.log(`Found ${allVideos.length} videos with Worker URLs!`);
console.log('Saved to video-list.json');