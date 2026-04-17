import type { Campaign } from '../components/IncrementalDashboard'

// ── KPI generator based on campaign type ────────────────────────────────────
// performanceMultiplier >= 1.0 is required to appear in the GD table.
// Programmatic (Display/CTV/Programmatic) is weighted highest per product spec.

interface KpiFields {
  kpiLabel: string
  kpiValue: number
  kpiUnit: string
  performanceMultiplier: number
  incrementalDollars: number
}

function kpi(type: string, budget: number, seed: number): KpiFields {
  const t = type.toLowerCase()
  const v = (seed % 9) / 9 // 0.0–0.89, deterministic variation per row

  if (t === 'ctv' || t.includes('ctv/ott') || t.includes('ctv live') || t === 'live sports') {
    return {
      kpiLabel: 'VCR', kpiUnit: '%',
      kpiValue:  parseFloat((76 + v * 15).toFixed(1)),
      performanceMultiplier: parseFloat((1.18 + v * 0.30).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.22 + v * 0.10)),
    }
  }
  if (t === 'video' || t === 'native video') {
    return {
      kpiLabel: 'VCR', kpiUnit: '%',
      kpiValue:  parseFloat((65 + v * 20).toFixed(1)),
      performanceMultiplier: parseFloat((1.10 + v * 0.22).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.16 + v * 0.10)),
    }
  }
  if (t === 'display' || t === 'rich media' || t === 'dooh' || t === 'programmatic') {
    // Programmatic Display — highest weighted
    return {
      kpiLabel: 'CTR', kpiUnit: '%',
      kpiValue:  parseFloat((1.0 + v * 2.0).toFixed(2)),
      performanceMultiplier: parseFloat((1.15 + v * 0.35).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.20 + v * 0.12)),
    }
  }
  if (t === 'audio') {
    return {
      kpiLabel: 'Completion', kpiUnit: '%',
      kpiValue:  parseFloat((80 + v * 14).toFixed(1)),
      performanceMultiplier: parseFloat((1.06 + v * 0.20).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.09 + v * 0.08)),
    }
  }
  if (t === 'native') {
    return {
      kpiLabel: 'CTR', kpiUnit: '%',
      kpiValue:  parseFloat((0.5 + v * 1.1).toFixed(2)),
      performanceMultiplier: parseFloat((1.04 + v * 0.16).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.11 + v * 0.08)),
    }
  }
  if (t === 'search' || t === 'google search') {
    return {
      kpiLabel: 'ROAS', kpiUnit: 'x',
      kpiValue:  parseFloat((3.8 + v * 2.4).toFixed(1)),
      performanceMultiplier: parseFloat((1.14 + v * 0.28).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.16 + v * 0.08)),
    }
  }
  if (t === 'meta' || t === 'tiktok' || t === 'linkedin') {
    return {
      kpiLabel: 'ROAS', kpiUnit: 'x',
      kpiValue:  parseFloat((2.8 + v * 1.8).toFixed(1)),
      performanceMultiplier: parseFloat((1.06 + v * 0.20).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.11 + v * 0.08)),
    }
  }
  if (t === 'youtube') {
    return {
      kpiLabel: 'VTR', kpiUnit: '%',
      kpiValue:  parseFloat((38 + v * 22).toFixed(1)),
      performanceMultiplier: parseFloat((1.09 + v * 0.22).toFixed(2)),
      incrementalDollars: Math.round(budget * (0.13 + v * 0.10)),
    }
  }
  // Miscellaneous / default
  return {
    kpiLabel: 'CTR', kpiUnit: '%',
    kpiValue:  parseFloat((0.8 + v * 1.2).toFixed(2)),
    performanceMultiplier: parseFloat((1.04 + v * 0.16).toFixed(2)),
    incrementalDollars: Math.round(budget * (0.09 + v * 0.08)),
  }
}

// ── Raw campaign data from Growth Suite Data sheet (Ended rows excluded) ─────

interface Raw {
  clientName: string
  name: string      // campaign type / name from sheet
  seller: string
  startDate: string // MM/DD/YYYY → converted below
  endDate: string
  budget: number
}

function d(mmddyyyy: string): string {
  const [m, dd, y] = mmddyyyy.split('/')
  return `${y}-${m.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

const RAW: Raw[] = [
  // ── Danielle Whiting — Northeast ──────────────────────────────────────────
  { clientName:'ABC Creative',               name:'Meta',           seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:49584   },
  { clientName:'ABC Creative',               name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:29452   },
  { clientName:'ABC Creative',               name:'Native',         seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:29452   },
  { clientName:'Bradley MediaWorks',         name:'Video',          seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:12000   },
  { clientName:'Bradley MediaWorks',         name:'Display',        seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:18000   },
  { clientName:'Bradley MediaWorks',         name:'Meta',           seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:15000   },
  { clientName:'Bradley MediaWorks',         name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'9/30/2026',  budget:25000   },
  { clientName:'Bradley MediaWorks',         name:'CTV',            seller:'Danielle Whiting', startDate:'12/15/2025', endDate:'7/31/2026',  budget:30000   },
  { clientName:'Bradley MediaWorks',         name:'Search',         seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:15000   },
  { clientName:'Crowley Webb',               name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'2/9/2026',   endDate:'12/20/2026', budget:100000  },
  { clientName:'Crowley Webb',               name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'3/9/2026',   endDate:'5/29/2026',  budget:56250   },
  { clientName:'Crowley Webb',               name:'Audio',          seller:'Danielle Whiting', startDate:'3/9/2026',   endDate:'5/29/2026',  budget:32500   },
  { clientName:'Crowley Webb : One Fortune', name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'2/9/2026',   endDate:'8/9/2026',   budget:36752   },
  { clientName:'Dixon Schwabl + Company',    name:'Display',        seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'9/30/2026',  budget:49442   },
  { clientName:'FARM',                       name:'Display',        seller:'Danielle Whiting', startDate:'1/18/2026',  endDate:'12/31/2026', budget:20000   },
  { clientName:'FARM',                       name:'Video',          seller:'Danielle Whiting', startDate:'1/18/2026',  endDate:'12/31/2026', budget:25000   },
  { clientName:'FARM',                       name:'Rich Media',     seller:'Danielle Whiting', startDate:'1/18/2026',  endDate:'12/31/2026', budget:25000   },
  { clientName:'Gelia-Media, Inc',           name:'Display',        seller:'Danielle Whiting', startDate:'3/2/2026',   endDate:'5/10/2026',  budget:20000   },
  { clientName:'Gelia-Media, Inc',           name:'Native',         seller:'Danielle Whiting', startDate:'3/2/2026',   endDate:'5/10/2026',  budget:10000   },
  { clientName:'Gelia-Media, Inc',           name:'Miscellaneous',  seller:'Danielle Whiting', startDate:'3/2/2026',   endDate:'5/10/2026',  budget:2000    },
  { clientName:'Gregson-Clark Spraying Equip',name:'YouTube',       seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'5/15/2026',  budget:7500    },
  { clientName:'Gregson-Clark Spraying Equip',name:'Display',       seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'5/15/2026',  budget:7500    },
  { clientName:'Idol Minds',                 name:'Display',        seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Idol Minds',                 name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'InSight',                    name:'Display',        seller:'Danielle Whiting', startDate:'2/5/2026',   endDate:'5/31/2026',  budget:15000   },
  { clientName:'InSight',                    name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'2/5/2026',   endDate:'5/31/2026',  budget:25000   },
  { clientName:'Jaffe',                      name:'Display',        seller:'Danielle Whiting', startDate:'1/12/2026',  endDate:'12/31/2026', budget:50000   },
  { clientName:'Jaffe',                      name:'CTV',            seller:'Danielle Whiting', startDate:'1/12/2026',  endDate:'12/31/2026', budget:100000  },
  { clientName:'Jaffe',                      name:'Video',          seller:'Danielle Whiting', startDate:'1/12/2026',  endDate:'12/31/2026', budget:40000   },
  { clientName:'Jaffe',                      name:'Display',        seller:'Danielle Whiting', startDate:'2/2/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'Jaffe',                      name:'Meta',           seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'Martin Agency',              name:'Display',        seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:100000  },
  { clientName:'Martin Agency',              name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:150000  },
  { clientName:'Martin Agency',              name:'Video',          seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'NBC Learn',                  name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'NBC Learn',                  name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'NBC Learn',                  name:'Video',          seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'NewsCom',                    name:'Display',        seller:'Danielle Whiting', startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'NewsCom',                    name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'2/1/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'NewsCom',                    name:'Video',          seller:'Danielle Whiting', startDate:'2/1/2026',   endDate:'8/31/2026',  budget:40000   },

  // ── Steven Miller — Northeast ─────────────────────────────────────────────
  { clientName:'IRAOS',                      name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:70000   },
  { clientName:'IRAOS',                      name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'IRAOS',                      name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'Janus Henderson',            name:'CTV',            seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:18000   },
  { clientName:'Janus Henderson',            name:'Display',        seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Janus Henderson',            name:'Audio',          seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:6000    },
  { clientName:'Janus Henderson',            name:'Video',          seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:9000    },
  { clientName:'Joanne Smith',               name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:12000   },
  { clientName:'JPMorgan Chase',             name:'Display',        seller:'Steven Miller',    startDate:'3/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'JPMorgan Chase',             name:'Video',          seller:'Steven Miller',    startDate:'3/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'JPMorgan Chase',             name:'CTV/OTT',        seller:'Steven Miller',    startDate:'3/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'Kforce',                     name:'Display',        seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Kforce',                     name:'Video',          seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Kforce',                     name:'CTV/OTT',        seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:10000   },
  { clientName:'Knope Advertising',          name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:80000   },
  { clientName:'Knope Advertising',          name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Knope Advertising',          name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Lilly',                      name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:125000  },
  { clientName:'Lilly',                      name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:200000  },
  { clientName:'Lilly',                      name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'LPL Financial',              name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:80000   },
  { clientName:'LPL Financial',              name:'CTV',            seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'LPL Financial',              name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'March of Dimes',             name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'March of Dimes',             name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'March of Dimes',             name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Marsh McLennan',             name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Marsh McLennan',             name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Marsh McLennan',             name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Mastercard',                 name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Mastercard',                 name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:225000  },
  { clientName:'Mastercard',                 name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:125000  },
  { clientName:'Medtronic',                  name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Medtronic',                  name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Medtronic',                  name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Mount Sinai',                name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Mount Sinai',                name:'CTV/OTT',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Mount Sinai',                name:'Video',          seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Network Media Advisors',     name:'Display',        seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Network Media Advisors',     name:'CTV/OTT',        seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Network Media Advisors',     name:'Video',          seller:'Steven Miller',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Newmark Real Estate',        name:'Display',        seller:'Steven Miller',    startDate:'3/1/2026',   endDate:'8/31/2026',  budget:60000   },
  { clientName:'Newmark Real Estate',        name:'CTV/OTT',        seller:'Steven Miller',    startDate:'3/1/2026',   endDate:'8/31/2026',  budget:90000   },
  { clientName:'Newmark Real Estate',        name:'Video',          seller:'Steven Miller',    startDate:'3/1/2026',   endDate:'8/31/2026',  budget:45000   },

  // ── Grayson Vickers — Northeast ───────────────────────────────────────────
  { clientName:'GWP',                        name:'YouTube',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:24000   },
  { clientName:'GWP',                        name:'CTV/OTT',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:78219   },
  { clientName:'GWP',                        name:'CTV',            seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:126000  },
  { clientName:'Josher Media Group',         name:'Display',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Josher Media Group',         name:'CTV',            seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:120000  },
  { clientName:'Josher Media Group',         name:'Video',          seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Josher Media Group',         name:'Native',         seller:'Grayson Vickers',  startDate:'3/1/2026',   endDate:'8/31/2026',  budget:25000   },
  { clientName:'Josher Media Group',         name:'Audio',          seller:'Grayson Vickers',  startDate:'2/1/2026',   endDate:'8/31/2026',  budget:30000   },
  { clientName:'Metro Media',                name:'Display',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Metro Media',                name:'CTV',            seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:90000   },
  { clientName:'Metro Media',                name:'Video',          seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:45000   },
  { clientName:'Morris Publishing',          name:'Display',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Morris Publishing',          name:'CTV/OTT',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Morris Publishing',          name:'Video',          seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:30000   },

  // ── Amy Murray — Northeast ────────────────────────────────────────────────
  { clientName:'AdsIntelligence',            name:'CTV',            seller:'Amy Murray',       startDate:'2/10/2026',  endDate:'6/30/2026',  budget:95000   },
  { clientName:'AdsIntelligence',            name:'Audio',          seller:'Amy Murray',       startDate:'2/10/2026',  endDate:'6/30/2026',  budget:25000   },
  { clientName:'AdsIntelligence',            name:'CTV',            seller:'Amy Murray',       startDate:'3/1/2026',   endDate:'5/31/2026',  budget:85000   },

  // ── Cailin Murphy — Northeast ─────────────────────────────────────────────
  { clientName:'Duffy & Shanley',            name:'YouTube',        seller:'Cailin Murphy',    startDate:'3/16/2026',  endDate:'5/14/2026',  budget:2000    },

  // ── Scott Welton — Southeast ──────────────────────────────────────────────
  { clientName:'Creative Fuel',              name:'YouTube',        seller:'Scott Welton',     startDate:'4/1/2026',   endDate:'9/30/2026',  budget:8800    },
  { clientName:'Creative Fuel',              name:'CTV/OTT',        seller:'Scott Welton',     startDate:'4/1/2026',   endDate:'9/30/2026',  budget:12750   },
  { clientName:'Creative Fuel',              name:'Video',          seller:'Scott Welton',     startDate:'4/1/2026',   endDate:'9/30/2026',  budget:13600   },
  { clientName:'FKQ',                        name:'YouTube',        seller:'Scott Welton',     startDate:'3/31/2026',  endDate:'7/19/2026',  budget:4000    },
  { clientName:'FKQ',                        name:'CTV',            seller:'Scott Welton',     startDate:'3/31/2026',  endDate:'7/19/2026',  budget:7000    },
  { clientName:'FKQ',                        name:'Video',          seller:'Scott Welton',     startDate:'3/31/2026',  endDate:'7/19/2026',  budget:3000    },

  // ── Larry Tucker — Southeast ──────────────────────────────────────────────
  { clientName:'3Headed Monster : Yum! Brands', name:'TikTok',      seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:22000   },
  { clientName:'3Headed Monster : Yum! Brands', name:'YouTube',     seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:14600   },
  { clientName:'3Headed Monster : Yum! Brands', name:'Meta',        seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:14000   },
  { clientName:'3Headed Monster : Yum! Brands', name:'DOOH',        seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:17000   },
  { clientName:'3Headed Monster : Yum! Brands', name:'Display',     seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:20000   },
  { clientName:'3Headed Monster : Yum! Brands', name:'Video',       seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:33000   },
  { clientName:'Culture Pilots',             name:'Video',          seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1500    },
  { clientName:'Culture Pilots',             name:'Display',        seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1500    },
  { clientName:'Gilbreath Communications',   name:'Display',        seller:'Larry Tucker',     startDate:'2/16/2026',  endDate:'5/20/2026',  budget:7231    },
  { clientName:'Gilbreath Communications',   name:'Meta',           seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:5801    },
  { clientName:'Gilbreath Communications',   name:'Google Search',  seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/20/2026',  budget:7000    },
  { clientName:'Gilbreath Communications',   name:'LinkedIn',       seller:'Larry Tucker',     startDate:'2/16/2026',  endDate:'5/20/2026',  budget:4000    },
  { clientName:'Gilbreath Communications',   name:'Google Search',  seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1934    },
  { clientName:'Gilbreath Communications',   name:'Meta',           seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/20/2026',  budget:7000    },
  { clientName:'Gilbreath Communications',   name:'Google Search',  seller:'Larry Tucker',     startDate:'2/16/2026',  endDate:'5/20/2026',  budget:8001    },
  { clientName:'Gilbreath Communications',   name:'Native',         seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/20/2026',  budget:5231    },
  { clientName:'Grapevine CVB',              name:'Google Search',  seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/24/2026',  budget:3000    },
  { clientName:'Grapevine CVB',              name:'YouTube',        seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:22000   },
  { clientName:'Grapevine CVB',              name:'Meta',           seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/24/2026',  budget:4000    },
  { clientName:'Grapevine CVB',              name:'Display',        seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/24/2026',  budget:8000    },
  { clientName:'Grapevine CVB',              name:'Display',        seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:33000   },
  { clientName:'Grapevine CVB',              name:'CTV/OTT',        seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:22000   },
  { clientName:'Grapevine CVB',              name:'Meta',           seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:11000   },
  { clientName:'Grapevine CVB',              name:'Google Search',  seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:63500   },

  // ── Kelly Calderone — Southeast ───────────────────────────────────────────
  { clientName:'Curiosity Marketing',        name:'Native',         seller:'Kelly Calderone',  startDate:'2/26/2026',  endDate:'5/25/2026',  budget:3000    },

  // ── Amy O'Hara — Midwest ──────────────────────────────────────────────────
  { clientName:'Agri Sciences Biologicals',  name:'Native',         seller:"Amy O'Hara",       startDate:'3/16/2026',  endDate:'7/31/2026',  budget:10800   },
  { clientName:'Agri Sciences Biologicals',  name:'Native Video',   seller:"Amy O'Hara",       startDate:'3/16/2026',  endDate:'7/31/2026',  budget:16200   },
  { clientName:'Agri Sciences Biologicals',  name:'Video',          seller:"Amy O'Hara",       startDate:'3/16/2026',  endDate:'7/31/2026',  budget:18600   },
  { clientName:'Bader Rutter',               name:'Display',        seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:21505   },
  { clientName:'Bader Rutter',               name:'Display',        seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:13930   },
  { clientName:'Bader Rutter',               name:'Display',        seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'5/31/2026',  budget:25100   },
  { clientName:'Bader Rutter',               name:'Display',        seller:"Amy O'Hara",       startDate:'4/1/2026',   endDate:'6/30/2026',  budget:28000   },
  { clientName:'Bader Rutter',               name:'CTV',            seller:"Amy O'Hara",       startDate:'2/2/2026',   endDate:'8/31/2026',  budget:103000  },
  { clientName:'Bader Rutter',               name:'Video',          seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:12375   },
  { clientName:'Bader Rutter',               name:'Video',          seller:"Amy O'Hara",       startDate:'2/2/2026',   endDate:'8/31/2026',  budget:15000   },
  { clientName:'Bader Rutter',               name:'Audio',          seller:"Amy O'Hara",       startDate:'1/26/2026',  endDate:'4/26/2026',  budget:20000   },
  { clientName:'Bader Rutter',               name:'Audio',          seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'5/31/2026',  budget:29400   },
  { clientName:'Bader Rutter',               name:'CTV Live Sports',seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:18725   },
  { clientName:'Bader Rutter',               name:'Audio',          seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:19600   },
  { clientName:'Bader Rutter',               name:'Video',          seller:"Amy O'Hara",       startDate:'11/10/2025', endDate:'5/31/2026',  budget:72341   },
  { clientName:'Dearing Group',              name:'CTV',            seller:"Amy O'Hara",       startDate:'3/4/2026',   endDate:'5/31/2026',  budget:6000    },
  { clientName:'Dearing Group',              name:'Display',        seller:"Amy O'Hara",       startDate:'3/4/2026',   endDate:'5/31/2026',  budget:3000    },

  // ── Jill Puerto — Midwest ─────────────────────────────────────────────────
  { clientName:'BlueSnap',                   name:'CTV',            seller:'Jill Puerto',      startDate:'4/1/2026',   endDate:'6/30/2026',  budget:8000    },
  { clientName:'BlueSnap',                   name:'Video',          seller:'Jill Puerto',      startDate:'4/1/2026',   endDate:'6/30/2026',  budget:4000    },
  { clientName:'Connelly Partners',          name:'CTV',            seller:'Jill Puerto',      startDate:'10/1/2025',  endDate:'9/30/2026',  budget:250944  },
  { clientName:'Connelly Partners',          name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'10/1/2025',  endDate:'9/30/2026',  budget:290000  },
  { clientName:'DCG One',                    name:'Display',        seller:'Jill Puerto',      startDate:'3/25/2026',  endDate:'6/30/2026',  budget:12500   },
  { clientName:'DCG One',                    name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'6/30/2026',  budget:10000   },
  { clientName:'Decibel Media',              name:'Native',         seller:'Jill Puerto',      startDate:'8/1/2025',   endDate:'5/31/2026',  budget:100235  },
  { clientName:'Decibel Media',              name:'Rich Media',     seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:14000   },
  { clientName:'Decibel Media',              name:'TikTok',         seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:15000   },
  { clientName:'Decibel Media',              name:'Native',         seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:46388   },
  { clientName:'Decibel Media',              name:'Display',        seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:60836   },
  { clientName:'Decibel Media',              name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:43000   },
  { clientName:'Freelance Media Services',   name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'4/30/2026',  budget:5500    },
  { clientName:'Freelance Media Services',   name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'4/30/2026',  budget:3500    },
  { clientName:'Freelance Media Services',   name:'Audio',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'4/30/2026',  budget:5500    },
  { clientName:'Insight Labs',               name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/15/2026',  endDate:'6/30/2026',  budget:12000   },
  { clientName:'K12 Inc',                    name:'CTV',            seller:'Jill Puerto',      startDate:'1/15/2026',  endDate:'9/30/2026',  budget:142500  },
  { clientName:'K12 Inc',                    name:'Display',        seller:'Jill Puerto',      startDate:'1/15/2026',  endDate:'9/30/2026',  budget:90000   },
  { clientName:'Kambi',                      name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:80000   },
  { clientName:'Kambi',                      name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:120000  },
  { clientName:'Kambi',                      name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Kambi',                      name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:20000   },
  { clientName:'Kelly Services',             name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Kelly Services',             name:'Video',          seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'KFC',                        name:'Display',        seller:'Jill Puerto',      startDate:'3/1/2026',   endDate:'12/31/2026', budget:80000   },
  { clientName:'Knightlight',                name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Knightlight',                name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'Knightlight',                name:'Video',          seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'8/31/2026',  budget:40000   },
  { clientName:'Knightlight',                name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'Kraft Heinz',                name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Kraft Heinz',                name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Kraft Heinz',                name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'LaCroix',                    name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'LaCroix',                    name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Loopy',                      name:'Display',        seller:'Jill Puerto',      startDate:'3/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Loopy',                      name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'3/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Loopy',                      name:'Video',          seller:'Jill Puerto',      startDate:'3/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:"Macy's",                     name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:200000  },
  { clientName:"Macy's",                     name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:300000  },
  { clientName:"Macy's",                     name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:"Maker's Mark",               name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:"Maker's Mark",               name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:90000   },
  { clientName:"Maker's Mark",               name:'Video',          seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:45000   },
  { clientName:'Marshall',                   name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Marshall',                   name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Mattel',                     name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Mattel',                     name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Mattel',                     name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:"McDonald's",                 name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:200000  },
  { clientName:"McDonald's",                 name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:300000  },
  { clientName:"McDonald's",                 name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Midas Touch',                name:'CTV',            seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Midas Touch',                name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'Miller Lite',                name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Miller Lite',                name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Miller Lite',                name:'Video',          seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Mondelez International',     name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Mondelez International',     name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Mondelez International',     name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Morton Salt',                name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Morton Salt',                name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Morton Salt',                name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Nelnet',                     name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Nelnet',                     name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:90000   },
  { clientName:'Nelnet',                     name:'Video',          seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:45000   },
  { clientName:'Nestle',                     name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Nestle',                     name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:225000  },
  { clientName:'Nestle',                     name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:125000  },
  { clientName:'Nestlé Purina PetCare',      name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Nestlé Purina PetCare',      name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Nestlé Purina PetCare',      name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Nordstrom',                  name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Nordstrom',                  name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Nordstrom',                  name:'Video',          seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Onyx Media',                 name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:89500   },
  { clientName:'Onyx Media',                 name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:125000  },
  { clientName:'Onyx Media',                 name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:95000   },
  { clientName:'Onyx Media',                 name:'Audio',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:85000   },
  { clientName:'Onyx Media',                 name:'Native',         seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:65000   },

  // ── Grace Dominique — Midwest ─────────────────────────────────────────────
  { clientName:'Flint Group',                name:'CTV',            seller:'Grace Dominique',  startDate:'2/10/2026',  endDate:'12/31/2026', budget:5100    },
  { clientName:'Flint Group',                name:'Display',        seller:'Grace Dominique',  startDate:'2/10/2026',  endDate:'12/31/2026', budget:1700    },
  { clientName:'Lennox',                     name:'Display',        seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:90000   },
  { clientName:'Lennox',                     name:'CTV',            seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Lennox',                     name:'Video',          seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Maytag',                     name:'Display',        seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Maytag',                     name:'CTV',            seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Maytag',                     name:'Video',          seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },

  // ── Katie Johnson — Midwest ───────────────────────────────────────────────
  { clientName:'Curious Plot',               name:'Display',        seller:'Katie Johnson',    startDate:'3/13/2026',  endDate:'3/31/2027',  budget:17550   },

  // ── Stephanie Jurney — Central ────────────────────────────────────────────
  { clientName:'Accelerate Impact Digital',  name:'Audio',          seller:'Stephanie Jurney', startDate:'3/26/2026',  endDate:'12/31/2026', budget:11875   },
  { clientName:'Accelerate Impact Digital',  name:'Audio',          seller:'Stephanie Jurney', startDate:'11/3/2025',  endDate:'11/30/2026', budget:13000   },
  { clientName:'Avenir Bold',                name:'TikTok',         seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:23000   },
  { clientName:'Avenir Bold',                name:'Meta',           seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:22500   },
  { clientName:'Avenir Bold',                name:'Video',          seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:13000   },
  { clientName:'Avenir Bold',                name:'YouTube',        seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:32000   },
  { clientName:'Avenir Bold',                name:'Display',        seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:9000    },
  { clientName:'Avenir Bold',                name:'Native',         seller:'Stephanie Jurney', startDate:'3/16/2026',  endDate:'6/15/2026',  budget:3825    },
  { clientName:'French West Vaughan',        name:'Display',        seller:'Stephanie Jurney', startDate:'1/1/2026',   endDate:'11/30/2026', budget:20300   },
  { clientName:'French West Vaughan',        name:'Video',          seller:'Stephanie Jurney', startDate:'1/1/2026',   endDate:'11/30/2026', budget:8700    },
  { clientName:'JGW Group',                  name:'Display',        seller:'Stephanie Jurney', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:60000   },
  { clientName:'JGW Group',                  name:'Video',          seller:'Stephanie Jurney', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:40000   },
  { clientName:'JGW Group',                  name:'CTV/OTT',        seller:'Stephanie Jurney', startDate:'3/1/2026',   endDate:'8/31/2026',  budget:50000   },

  // ── Ross Peters — Central ─────────────────────────────────────────────────
  { clientName:'Agency GWL',                 name:'Google Search',  seller:'Ross Peters',      startDate:'4/1/2026',   endDate:'4/30/2026',  budget:12250   },
  { clientName:'Agency Pure',                name:'Display',        seller:'Ross Peters',      startDate:'2/9/2026',   endDate:'6/30/2026',  budget:7500    },
  { clientName:'Agency Pure',                name:'Video',          seller:'Ross Peters',      startDate:'2/9/2026',   endDate:'6/30/2026',  budget:7500    },
  { clientName:'CJRW',                       name:'Display',        seller:'Ross Peters',      startDate:'8/28/2025',  endDate:'6/30/2026',  budget:38068   },
  { clientName:'CJRW',                       name:'Display',        seller:'Ross Peters',      startDate:'1/26/2026',  endDate:'11/22/2026', budget:70298   },
  { clientName:'CJRW',                       name:'Video',          seller:'Ross Peters',      startDate:'1/26/2026',  endDate:'11/22/2026', budget:60098   },
  { clientName:'CJRW',                       name:'Video',          seller:'Ross Peters',      startDate:'8/28/2025',  endDate:'6/30/2026',  budget:114204  },
  { clientName:'CJRW',                       name:'CTV/OTT',        seller:'Ross Peters',      startDate:'1/26/2026',  endDate:'11/22/2026', budget:125375  },
  { clientName:'Cranford and Co',            name:'Display',        seller:'Ross Peters',      startDate:'4/21/2026',  endDate:'11/22/2026', budget:24000   },
  { clientName:'Cranford and Co',            name:'CTV/OTT',        seller:'Ross Peters',      startDate:'2/23/2026',  endDate:'6/30/2026',  budget:23800   },
  { clientName:'Cranford and Co',            name:'CTV/OTT',        seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'6/7/2026',   budget:89896   },
  { clientName:'Cranford and Co',            name:'Display',        seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'10/25/2026', budget:38114   },
  { clientName:'Cranford and Co',            name:'CTV',            seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'6/7/2026',   budget:29965   },
  { clientName:'Cranford and Co',            name:'Video',          seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'10/25/2026', budget:51566   },
  { clientName:'Cranford and Co',            name:'DOOH',           seller:'Ross Peters',      startDate:'4/21/2026',  endDate:'11/22/2026', budget:8000    },
  { clientName:'Outwire Media',              name:'Display',        seller:'Ross Peters',      startDate:'1/15/2026',  endDate:'12/31/2026', budget:38000   },
  { clientName:'Outwire Media',              name:'Video',          seller:'Ross Peters',      startDate:'1/15/2026',  endDate:'12/31/2026', budget:42000   },
  { clientName:'Outwire Media',              name:'CTV/OTT',        seller:'Ross Peters',      startDate:'1/15/2026',  endDate:'12/31/2026', budget:68000   },
  { clientName:'Outwire Media',              name:'Audio',          seller:'Ross Peters',      startDate:'1/15/2026',  endDate:'12/31/2026', budget:28000   },

  // ── Jenny DeBono — Central ────────────────────────────────────────────────
  { clientName:'Anson Stoner',               name:'CTV/OTT',        seller:'Jenny DeBono',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:25725   },
  { clientName:'Dalton Agency',              name:'Display',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:13600   },
  { clientName:'Dalton Agency',              name:'YouTube',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:11280   },
  { clientName:'Dalton Agency',              name:'CTV Live Sports',seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:20000   },
  { clientName:'Dalton Agency',              name:'Video',          seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:29205   },
  { clientName:'Dalton Agency',              name:'Rich Media',     seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:31200   },
  { clientName:'Dalton Agency',              name:'Native Video',   seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:28950   },
  { clientName:'Dalton Agency',              name:'CTV/OTT',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:40000   },
  { clientName:'Dalton Agency',              name:'Native',         seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:32750   },
  { clientName:'Dalton Agency',              name:'Audio',          seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:14000   },

  // ── Scott Wright — Central ────────────────────────────────────────────────
  { clientName:'Bullseye Strategy',          name:'CTV/OTT',        seller:'Scott Wright',     startDate:'3/25/2026',  endDate:'4/26/2026',  budget:3350    },
  { clientName:'Bullseye Strategy',          name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:18480   },
  { clientName:'Bullseye Strategy',          name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:5500    },
  { clientName:'Crackerjack Media',          name:'Audio',          seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:12750   },
  { clientName:'Crackerjack Media',          name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:19125   },
  { clientName:'Crackerjack Media',          name:'Video',          seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:7650    },
  { clientName:'Crackerjack Media',          name:'Display',        seller:'Scott Wright',     startDate:'2/2/2026',   endDate:'5/6/2026',   budget:5000    },
  { clientName:'Crackerjack Media',          name:'Display',        seller:'Scott Wright',     startDate:'12/15/2025', endDate:'8/30/2026',  budget:12000   },
  { clientName:'Crackerjack Media',          name:'YouTube',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:11475   },
  { clientName:'Fieldtrip',                  name:'Display',        seller:'Scott Wright',     startDate:'3/16/2026',  endDate:'6/15/2026',  budget:8000    },
  { clientName:'Jump by Mettle',             name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:3000    },

  // ── Gargi Bhakta — Central ────────────────────────────────────────────────
  { clientName:'Davis South Barnette',       name:'CTV',            seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:31000   },
  { clientName:'Davis South Barnette',       name:'Display',        seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:72292   },
  { clientName:'Davis South Barnette',       name:'Google Search',  seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:138740  },
  { clientName:'Davis South Barnette',       name:'Display',        seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:152680  },
  { clientName:'Davis South Barnette',       name:'CTV/OTT',        seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:39447   },
  { clientName:'Davis South Barnette',       name:'CTV',            seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:31261   },
  { clientName:'Davis South Barnette',       name:'Native',         seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:102674  },
  { clientName:'Davis South Barnette',       name:'Native',         seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:22800   },

  // ── Jeffrey Saunders — Central ────────────────────────────────────────────
  { clientName:'iCrossing',                  name:'Display',        seller:'Jeffrey Saunders', startDate:'2/11/2026',  endDate:'12/31/2026', budget:75000   },
  { clientName:'iCrossing',                  name:'Video',          seller:'Jeffrey Saunders', startDate:'4/22/2026',  endDate:'9/30/2026',  budget:100000  },
  { clientName:'iCrossing',                  name:'Display',        seller:'Jeffrey Saunders', startDate:'4/22/2026',  endDate:'9/30/2026',  budget:100000  },

  // ── Tessa Walsh — West ────────────────────────────────────────────────────
  { clientName:'Conroy Media',               name:'Display',        seller:'Tessa Walsh',      startDate:'3/19/2026',  endDate:'4/19/2026',  budget:18725   },
  { clientName:'Kickoff',                    name:'CTV/OTT',        seller:'Tessa Walsh',      startDate:'3/15/2026',  endDate:'4/30/2026',  budget:8000    },
  { clientName:'Montana Board of Tourism',   name:'Display',        seller:'Tessa Walsh',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Montana Board of Tourism',   name:'CTV/OTT',        seller:'Tessa Walsh',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:90000   },
  { clientName:'Montana Board of Tourism',   name:'Video',          seller:'Tessa Walsh',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:45000   },
  { clientName:'Moore County Tourism',       name:'Display',        seller:'Tessa Walsh',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'Moore County Tourism',       name:'CTV/OTT',        seller:'Tessa Walsh',      startDate:'2/1/2026',   endDate:'12/31/2026', budget:45000   },

  // ── Joshua Gallo — West ───────────────────────────────────────────────────
  { clientName:'Explore Communications',     name:'Display',        seller:'Joshua Gallo',     startDate:'3/30/2026',  endDate:'11/1/2026',  budget:12000   },
  { clientName:'Idyll',                      name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Idyll',                      name:'Video',          seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:20000   },
  { clientName:'Idyll',                      name:'Meta',           seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Kindred Spirits',            name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Kindred Spirits',            name:'Video',          seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:20000   },
  { clientName:'Kindred Spirits',            name:'Native',         seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Kinetic',                    name:'Display',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'Kinetic',                    name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'Kinetic',                    name:'Video',          seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:25000   },
  { clientName:'Kinetic',                    name:'Audio',          seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:20000   },
  { clientName:'Logitech',                   name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Logitech',                   name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Logitech',                   name:'Video',          seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:"McCormick & Schmick's",      name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:"McCormick & Schmick's",      name:'Display',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:30000   },
  { clientName:"McCormick & Schmick's",      name:'Video',          seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:20000   },
  { clientName:'Michelman and Robinson',     name:'Display',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'Michelman and Robinson',     name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:100000  },
  { clientName:'Michelman and Robinson',     name:'Video',          seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'Mike Ditka',                 name:'Display',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:40000   },
  { clientName:'Mojo Organics',              name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Moni',                       name:'Display',        seller:'Joshua Gallo',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:18000   },
  { clientName:'Moni',                       name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:25000   },
  { clientName:'Moni',                       name:'Video',          seller:'Joshua Gallo',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:12000   },
  { clientName:'Motiva Group',               name:'Display',        seller:'Joshua Gallo',     startDate:'3/1/2026',   endDate:'6/30/2026',  budget:30000   },
  { clientName:'Motiva Group',               name:'Video',          seller:'Joshua Gallo',     startDate:'3/1/2026',   endDate:'6/30/2026',  budget:20000   },
  { clientName:'Moziah Bridges',             name:'Display',        seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'Moziah Bridges',             name:'Video',          seller:'Joshua Gallo',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:30000   },
  { clientName:'Newman Hall',                name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'Newman Hall',                name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Newman Hall',                name:'Video',          seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'Nikon',                      name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Nikon',                      name:'CTV/OTT',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'Nikon',                      name:'Video',          seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Nest Seekers International', name:'Display',        seller:'Joshua Gallo',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:40000   },

  // ── Jacob Kearney — West ──────────────────────────────────────────────────
  { clientName:'Gud Marketing',              name:'CTV Live Sports',seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'9/30/2026',  budget:63000   },
  { clientName:'Gud Marketing',              name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'9/30/2026',  budget:70000   },
  { clientName:'Identify Media',             name:'Display',        seller:'Jacob Kearney',    startDate:'2/19/2026',  endDate:'6/30/2026',  budget:37500   },
  { clientName:'Joint Media',                name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'4/1/2026',   endDate:'4/30/2026',  budget:15000   },
  { clientName:'Legacy',                     name:'Display',        seller:'Jacob Kearney',    startDate:'4/1/2026',   endDate:'4/30/2026',  budget:8000    },
  { clientName:'Lime',                       name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'MrBeast',                    name:'Display',        seller:'Jacob Kearney',    startDate:'3/1/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'MrBeast',                    name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'3/1/2026',   endDate:'8/31/2026',  budget:100000  },
  { clientName:'MrBeast',                    name:'Video',          seller:'Jacob Kearney',    startDate:'3/1/2026',   endDate:'8/31/2026',  budget:50000   },
  { clientName:'New Balance',                name:'Display',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'New Balance',                name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'New Balance',                name:'Video',          seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Nissan',                     name:'Display',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Nissan',                     name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:225000  },
  { clientName:'Nissan',                     name:'Video',          seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:125000  },

  // ── Jeff DePew — West ─────────────────────────────────────────────────────
  { clientName:'eMedia Marketing Solutions', name:'Display',        seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'4/30/2026',  budget:2400    },
  { clientName:'eMedia Marketing Solutions', name:'CTV/OTT',        seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'4/30/2026',  budget:3200    },
  { clientName:'eMedia Marketing Solutions', name:'CTV',            seller:'Jeff DePew',       startDate:'4/2/2026',   endDate:'7/31/2026',  budget:19200   },
  { clientName:'J3',                         name:'CTV/OTT',        seller:'Jeff DePew',       startDate:'3/16/2026',  endDate:'6/30/2026',  budget:25000   },
  { clientName:'J3',                         name:'CTV/OTT',        seller:'Jeff DePew',       startDate:'2/9/2026',   endDate:'5/31/2026',  budget:45000   },
  { clientName:'J3',                         name:'Display',        seller:'Jeff DePew',       startDate:'2/9/2026',   endDate:'5/31/2026',  budget:20000   },
  { clientName:'Kayak',                      name:'Display',        seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'9/30/2026',  budget:12000   },
  { clientName:'Kayak',                      name:'CTV/OTT',        seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'9/30/2026',  budget:20000   },
  { clientName:'Kayak',                      name:'Video',          seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'9/30/2026',  budget:10000   },

  // ── Kyle McBride — West ───────────────────────────────────────────────────
  { clientName:'Human Condition Media',      name:'CTV',            seller:'Kyle McBride',     startDate:'5/1/2026',   endDate:'8/31/2026',  budget:75000   },
  { clientName:'Human Condition Media',      name:'Display',        seller:'Kyle McBride',     startDate:'6/1/2026',   endDate:'9/30/2026',  budget:75000   },
  { clientName:'Human Condition Media',      name:'Display',        seller:'Kyle McBride',     startDate:'3/1/2026',   endDate:'5/31/2026',  budget:25000   },
  { clientName:'Imminence Media',            name:'Display',        seller:'Kyle McBride',     startDate:'1/30/2026',  endDate:'6/30/2026',  budget:44000   },
  { clientName:'Imminence Media',            name:'Display',        seller:'Kyle McBride',     startDate:'2/1/2026',   endDate:'8/31/2026',  budget:76000   },
  { clientName:'Imminence Media',            name:'CTV/OTT',        seller:'Kyle McBride',     startDate:'3/1/2026',   endDate:'8/31/2026',  budget:57000   },
  { clientName:'Imminence Media',            name:'Display',        seller:'Kyle McBride',     startDate:'3/9/2026',   endDate:'8/31/2026',  budget:38000   },
  { clientName:'Imminence Media',            name:'Video',          seller:'Kyle McBride',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:15000   },
  { clientName:"Kellogg's Brand Activation", name:'Display',        seller:'Kyle McBride',     startDate:'2/1/2026',   endDate:'12/31/2026', budget:50000   },

  // ── Adriana Richards — West ───────────────────────────────────────────────
  { clientName:'Bio-Techne',                 name:'Display',        seller:'Adriana Richards', startDate:'3/12/2026',  endDate:'6/30/2026',  budget:3500    },
  { clientName:'Bio-Techne',                 name:'Display',        seller:'Adriana Richards', startDate:'3/20/2026',  endDate:'6/30/2026',  budget:3500    },
  { clientName:'Bio-Techne',                 name:'Display',        seller:'Adriana Richards', startDate:'3/27/2026',  endDate:'6/30/2026',  budget:4500    },
  { clientName:'Bio-Techne',                 name:'Display',        seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:11000   },
  { clientName:'Dean Houston',               name:'Display',        seller:'Adriana Richards', startDate:'3/26/2026',  endDate:'7/3/2026',   budget:3000    },
  { clientName:'Dean Houston',               name:'Video',          seller:'Adriana Richards', startDate:'3/26/2026',  endDate:'7/3/2026',   budget:5000    },
  { clientName:'Dean Houston',               name:'Display',        seller:'Adriana Richards', startDate:'2/27/2026',  endDate:'4/19/2026',  budget:2350    },
  { clientName:'First City Credit Union',    name:'Display',        seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:8250    },
  { clientName:'First City Credit Union',    name:'CTV/OTT',        seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:10250   },
  { clientName:'First City Credit Union',    name:'Video',          seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:7000    },
  { clientName:'First City Credit Union',    name:'Native',         seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:4500    },
  { clientName:'First City Credit Union',    name:'Google Search',  seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:15000   },

  // ── Michael Bell — Political ──────────────────────────────────────────────
  { clientName:'Ironbound Films',            name:'Display',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Ironbound Films',            name:'CTV/OTT',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Ironbound Films',            name:'Display',        seller:'Michael Bell',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Ironbound Films',            name:'Video',          seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:20000   },
  { clientName:'Ironbound Films',            name:'Video',          seller:'Michael Bell',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'KO Media',                   name:'Display',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:100000  },
  { clientName:'KO Media',                   name:'CTV/OTT',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'KO Media',                   name:'Video',          seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Monumental Sports',          name:'Display',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Monumental Sports',          name:'CTV/OTT',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'Monumental Sports',          name:'Video',          seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'NFL',                        name:'CTV Live Sports', seller:'Michael Bell',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:300000  },
  { clientName:'NHL',                        name:'CTV Live Sports', seller:'Michael Bell',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:200000  },

  // ── Nicole Meade — Political ──────────────────────────────────────────────
  { clientName:'Blue Chair',                 name:'DOOH',           seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:81250   },
  { clientName:'Blue Chair',                 name:'Live Sports',    seller:'Nicole Meade',     startDate:'1/12/2026',  endDate:'12/31/2026', budget:34000   },
  { clientName:'Blue Chair',                 name:'CTV/OTT',        seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Blue Chair',                 name:'Live Sports',    seller:'Nicole Meade',     startDate:'3/13/2026',  endDate:'12/31/2026', budget:34000   },
  { clientName:'Blue Chair',                 name:'Live Sports',    seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:76500   },
  { clientName:'Blue Chair',                 name:'Audio',          seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:42500   },
  { clientName:'Blue Chair',                 name:'Video',          seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Blue Chair',                 name:'Video',          seller:'Nicole Meade',     startDate:'1/12/2026',  endDate:'12/31/2026', budget:71400   },

  // ── Jonathan Phelps — Political ───────────────────────────────────────────
  { clientName:'DCI Group',                  name:'CTV/OTT',        seller:'Jonathan Phelps',  startDate:'3/3/2026',   endDate:'4/30/2026',  budget:9600    },

  // ── Thomas Buell — Regional Majors ────────────────────────────────────────
  { clientName:'Barbauld Agency',            name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:1500    },
  { clientName:'Barbauld Agency',            name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:500     },
  { clientName:'Barbauld Agency',            name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:1500    },
  { clientName:'Barbauld Agency',            name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:1500    },
  { clientName:'Brandera',                   name:'Display',        seller:'Thomas Buell',     startDate:'2/19/2026',  endDate:'9/30/2026',  budget:17850   },
  { clientName:'Brandera',                   name:'Display',        seller:'Thomas Buell',     startDate:'3/29/2026',  endDate:'6/18/2026',  budget:18350   },
  { clientName:'DeMeyer Furniture',          name:'CTV',            seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'12/31/2026', budget:27000   },
  { clientName:'DeMeyer Furniture',          name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'12/31/2026', budget:67500   },

  // ── Greg Kupfner — Regional Majors ────────────────────────────────────────
  { clientName:'CAS Cable',                  name:'Video',          seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1000    },
  { clientName:'CAS Cable',                  name:'CTV/OTT',        seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:2000    },
  { clientName:'CAS Cable',                  name:'Display',        seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1000    },
  { clientName:'Conquest Media Group',       name:'CTV',            seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:11000   },
  { clientName:'Conquest Media Group',       name:'CTV/OTT',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:17040   },
  { clientName:'Conquest Media Group',       name:'Display',        seller:'Greg Kupfner',     startDate:'3/3/2026',   endDate:'12/31/2026', budget:7600    },
  { clientName:'Conquest Media Group',       name:'Display',        seller:'Greg Kupfner',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:4800    },
  { clientName:'Conquest Media Group',       name:'CTV',            seller:'Greg Kupfner',     startDate:'3/3/2026',   endDate:'12/31/2026', budget:9600    },
  { clientName:'Conquest Media Group',       name:'Display',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:6650    },
  { clientName:'Conquest Media Group',       name:'Display',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:8550    },
  { clientName:'Conquest Media Group',       name:'Display',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:6650    },
  { clientName:'Conquest Media Group',       name:'CTV',            seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:11000   },
  { clientName:'Intermark Electronics',      name:'Display',        seller:'Greg Kupfner',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:22500   },
  { clientName:'Intermark Electronics',      name:'Display',        seller:'Greg Kupfner',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:22500   },
  { clientName:'Intermark Electronics',      name:'CTV',            seller:'Greg Kupfner',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:15000   },
  { clientName:'Micro Plastics Inc.',        name:'Display',        seller:'Greg Kupfner',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:25000   },
  { clientName:'Neurochem International',    name:'Display',        seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'12/31/2026', budget:25000   },

  // ── Geoff Halsema — Retail Solutions ──────────────────────────────────────
  { clientName:'Fox Dealer',                 name:'CTV',            seller:'Geoff Halsema',    startDate:'4/14/2026',  endDate:'6/30/2026',  budget:144000  },
  { clientName:'KAR Auction Services',       name:'Display',        seller:'Geoff Halsema',    startDate:'1/15/2026',  endDate:'12/31/2026', budget:252000  },
  { clientName:'KAR Auction Services',       name:'CTV',            seller:'Geoff Halsema',    startDate:'2/1/2026',   endDate:'5/31/2026',  budget:50000   },
  { clientName:'KAR Auction Services',       name:'Display',        seller:'Geoff Halsema',    startDate:'2/1/2026',   endDate:'12/31/2026', budget:108000  },
  { clientName:'KAR Auction Services',       name:'CTV',            seller:'Geoff Halsema',    startDate:'3/1/2026',   endDate:'12/31/2026', budget:300000  },
]

export const CAMPAIGNS: Campaign[] = RAW.map((r, i) => ({
  id: String(i + 1),
  clientName: r.clientName,
  name: r.name,
  seller: r.seller,
  startDate: d(r.startDate),
  endDate: d(r.endDate),
  budget: r.budget,
  ...kpi(r.name, r.budget, i),
}))
