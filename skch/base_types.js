/* Custom type definitions for mapping algorithm
 */

function MinimizerInfo(hash, seqId, wpos, strand){
    //Information about each minimizer
    
    this.hash = hash;       //hash value
    this.seqId = seqId;     //sequence or contig id
    this.wpos = wpos;       //First (left-most) window position when the minimizer is saved
    this.strand = strand;   //strand information
    this.min_info_array = [this.hash, this.seqId, this.wpos, this.strand];  //array of properties for comparison operations

    this.lex_less = function(x){
        for (i=0; i<this.min_info_array.length; i++){
            if (this.min_info_array[i] < x.min_info_array[i]){
                return true
            }
        return false;
        }
    }

    this.lex_equal = function (x){
        for (i=0; i<this.min_info_array.length; i++){
            if (this.min_info_array[i] != x.min_info_array[i]){
                return false
            }
        return true;
        }
    }
};

function MinimizerMetaData(seqId, wpos, strand){
    //Type for map value type used for L1 stage lookup index
    
    this.seqId = seqId;     //sequence or contig id
    this.wpos = wpos;       //window position (left-most window)
    this.strand = strand;   //strand information

    this.min_metadata_array = [this.seqId, this.wpos, this.strand]  //array for comparison operation

    this.lex_less = function (x){
        for (i=0; i<this.min_metadata_array.length; i++){
            if (this.min_metadata_array[i] < x.min_metadata_array[i]){
                return true
            }
        return false;
        }
    }
};

//const MMD_1 = new MinimizerMetaData(1, 2, 3);
//const MMD_2 = new MinimizerMetaData(1, 2, 3);
//console.log(MMD_1.lex_less(MMD_2));
//console.log(MMD_2.lex_less(MMD_1));

function ContigInfo(name, len){
    //Metadata for recording contigs in the reference DB
    this.name = name;   //Name of the sequence
    this.len = len;     //Length of the sequence
};

//Label tags for strand information
const strand = {
    FWD: 1,
    REV: -1
};

const evnt = {
    BEGIN: 1,
    END: 2
};

//filter mode in mashmap
const filter = {
    MAP: 1,         //filter by query axis
    ONETOONE: 2,    //filter by query axis and reference axis
    NONE: 3         //no filtering
};

function MappingResult (queryLen, refStartPos, refEndPos, queryStartPos,
    queryEndPos, refSeqId, querySeqId, nucIdentity, nucIdentityUpperBound,
    sketchSize, conservedSketches, strand, splitMappingId, discard){

    this.queryLen = queryLen;                               //length of the query sequence
    this.refStartPos = refStartPos;                         //start position of the mapping on reference
    this.refEndPos = refEndPos;                             //end pos
    this.queryStartPos = queryStartPos;                     //start position of the query for this mapping
    this.queryEndPos = queryEndPos;                         //end position of the query for this mapping
    this.refSeqId = refSeqId;                               //internal sequence id of the reference contig
    this.querySeqId = querySeqId;                           //internal sequence id of the query sequence
    this.nucIdentity = nucIdentity;                         //calculated identity
    this.nucIdentityUpperBound = nucIdentityUpperBound;     //upper bound on identity (90% C.I.)
    this.sketchSize = sketchSize;                           //sketch size
    this.strand = strand;                                   //strand

    //for split read mapping
    
    this.splitMappingId = splitMappingId;                   //To identify split mappings that are chained
    this.discard = 1;                                       //set to 1 for deletion


    this.qlen = () => {                                     //length of this mapping on the query axis
        return queryEndPos - queryStartPos + 1;
    }

    this.rlen = () => {                                     //length of this mapping on the ref axis
        return refEndPos - refStartPos + 1;
    }
};

function InputSeqContainer(seqCounter, len, seq, seqName){
    //Container to save copy of bionode-fasta object
    this.seqCounter = seqCounter;   //sequence counter
    this.len = len;                 //sequence length
    this.seq = seq;                 //sequence string
    this.seqName = seqName;         //sequence id
};

function MapModuleOutput(readMappings, qseqName){
    //Output type of map function

    this.readMappings = readMappings;   //array of MappingResult objects
    this.qseqName = qseqName;           //query sequence id

    this.reset = () => {
        this.readMappings = [];
    };
};

function QueryMetaData (seq, seqCounter, len, sketchsize, minimizerTableQuery){
    this.seq = seq;                 //query sequence
    this.seqCounter = seqCounter;   //query sequence counter
    this.len = len;                 //length of this query sequence
    this.sketchSize = sketchSize;   //sketch size
    this.minimizerTableQuery;       //Vector of minimizers in the query
};
