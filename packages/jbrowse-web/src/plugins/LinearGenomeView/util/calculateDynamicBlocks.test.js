import calculateVisibleRegions from './calculateDynamicBlocks'

const ctgA = { assemblyName: 'volvox', refName: 'ctgA', start: 0, end: 50000 }

test('one', () => {
  expect(
    calculateVisibleRegions(
      {
        offsetPx: 0,
        viewingRegionWidth: 200,
        displayedRegions: [ctgA],
        bpPerPx: 1,
      },
      false,
    ),
  ).toEqual([
    {
      assemblyName: 'volvox',
      end: 200,
      offsetPx: 0,
      refName: 'ctgA',
      start: 0,
      parentRegion: ctgA,
      isLeftEndOfDisplayedRegion: true,
      isRightEndOfDisplayedRegion: false,
      key: 'volvox:ctgA:1-200',
      widthPx: 200,
    },
  ])
})
test('two', () => {
  expect(
    calculateVisibleRegions(
      {
        offsetPx: 0,
        viewingRegionWidth: 200,
        displayedRegions: [ctgA],
        bpPerPx: 1,
      },
      true,
    ),
  ).toEqual([
    {
      assemblyName: 'volvox',
      end: 50000,
      offsetPx: 0,
      refName: 'ctgA',
      start: 49800,
      parentRegion: ctgA,
      isLeftEndOfDisplayedRegion: true,
      isRightEndOfDisplayedRegion: false,
      key: 'volvox:ctgA:49801-50000',
      widthPx: 200,
    },
  ])
})
test('three', () => {
  expect(
    calculateVisibleRegions(
      {
        offsetPx: -100,
        viewingRegionWidth: 200,
        displayedRegions: [ctgA],
        bpPerPx: 1,
      },
      true,
    ),
  ).toEqual([
    {
      assemblyName: 'volvox',
      end: 50000,
      offsetPx: 0,
      refName: 'ctgA',
      start: 49900,
      parentRegion: ctgA,
      isLeftEndOfDisplayedRegion: true,
      isRightEndOfDisplayedRegion: false,
      key: 'volvox:ctgA:49901-50000',
      widthPx: 100,
    },
  ])
})
test('four', () => {
  expect(
    calculateVisibleRegions(
      {
        offsetPx: -100,
        viewingRegionWidth: 350,
        displayedRegions: [ctgA],
        bpPerPx: 1,
      },
      false,
    ),
  ).toEqual([
    {
      assemblyName: 'volvox',
      end: 250,
      offsetPx: 0,
      refName: 'ctgA',
      start: 0,
      parentRegion: ctgA,
      isLeftEndOfDisplayedRegion: true,
      isRightEndOfDisplayedRegion: false,
      key: 'volvox:ctgA:1-250',
      widthPx: 250,
    },
  ])
})
test('five', () => {
  expect(
    calculateVisibleRegions(
      {
        offsetPx: 521,
        viewingRegionWidth: 927,
        displayedRegions: [ctgA],
        bpPerPx: 0.05,
      },
      false,
    ),
  ).toEqual([
    {
      assemblyName: 'volvox',
      end: 73,
      offsetPx: 520,
      refName: 'ctgA',
      start: 26,
      parentRegion: ctgA,
      isLeftEndOfDisplayedRegion: false,
      isRightEndOfDisplayedRegion: false,
      key: 'volvox:ctgA:27-73',
      widthPx: 940,
    },
  ])
})
