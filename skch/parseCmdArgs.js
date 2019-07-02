/* Command line argument parser
 */

const argv = require('yargs')
    .usage('-----------------\n Mashmap is an approximate long read or contig mapper based on Jaccard similarity\n -----------------\n Example usage: \n $ mashmap -r ref.fa -q seq.fq [OPTIONS]\n $ mashmap --rl reference_files_list.txt -q seq.fq [OPTIONS]')
    .help('h')

    .option('ref', {
        desc: 'an input reference file (fasta/fastq)[.gz]',
        alias: 'r',
        nargs: 1,
        requiresArg: true,
    })

    .option('refList', {
        desc: 'a file containing list of reference files, one per line',
        alias: 'rl',
        nargs: 1,
        requiresArg: true,
    })

    .option('query', {
        desc: 'an input query file (fasta/fastq)[.gz]',
        alias: 'q',
        nargs: 1,
        requiresArg: true,
    })

    .option('queryList', {
        desc: 'a file containing list of query files, one per line',
        alias: 'ql',
        nargs: 1,
        requiresArg: true,
    })


    .option('segLength', {
        desc: 'mapping segment length \n sequences shorter than segment length will be ignored',
        alias: 's',
        default: 5000,
    })

    .option('noSplit', {
        desc: 'disable splitting of input sequences during mapping [enabled by default]',
        boolean: true,
        default: true,
    })

    .option('perc_identity', {
        desc: 'threshold for identity ',
        alias: 'pi',
        requiresArg: true,
        default: 85,
    })
    
    .option('thread', {
        desc: 'count of threads for parallel execution ',
        alias: 't',
        requiresArg: true,
        default: 1,
    })
    
    .option('output', {
        desc: 'output file name ', 
        alias: 'o',
        requiresArg: true,
        default: 'mashmap.out',
    })

    .option('kmer', {
        desc: 'kmer size <= 16 ', 
        alias: 'k',
        requiresArg: true,
        default: 16,
    })

    .option('filter_mode', {
        desc: 'filter modes in mashmap: map, one-to-one or none \n map computes best mappings for each query sequence\n one-to-one computes best mappings for query as well as reference sequence\n none disables filtering',
        alias: 'f',
        requiresArg: true,
        default: 'map',
    })

    .argv;




