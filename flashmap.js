/* Wrapper for handling cmd line operation of flashmap
 */

const map_parameters = require('./skch/map_parameters.js');
const parseCmdArgs = require('./skch/parseCmdArgs.js');
const winSketch = require('./skch/winSketch.js');
const computeMap = require('./skch/computeMap.js');

function main(argv){
    parseCmdArgs.initCmdParser();

    const parameters = new map_parameters.Parameters;

    parseCmdArgs.parseandSave(argv.length, argv, parameters);

    const t0 = new Date();

    //Build sketch for reference 
    const referSketch = new winSketch.Sketch(parameters);

    const timeRefSketch = new Date() - t0;

    console.log(`INFO, flashmap, Time spent computing the reference index: ${timeRefSketch} sec`);

    const t0 = new Date();
    
    //Map the sequences in the query file
    const mapper = new computeMap.Map(parameters, referSketch);

    const timeMapQuery = new Date() - t0;

    console.log(`INFO, flashmap, Time spent mapping the query: ${timeMapQuery} sec`);
    console.log(`INFO, flashmap, Mapping results saved in: ${parameters.outFileName} sec`);
}
    

