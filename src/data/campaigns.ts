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

// ── Raw campaign data — sourced exclusively from Executive Suite Data CSV ────
// Only clients with non-zero Tactic Budget (column D) are included.

interface Raw {
  clientName: string
  name: string      // campaign type
  seller: string
  startDate: string // MM/DD/YYYY
  endDate: string
  budget: number
}

function d(mmddyyyy: string): string {
  const [m, dd, y] = mmddyyyy.split('/')
  return `${y}-${m.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

const RAW: Raw[] = [

  // ── Danielle Whiting — Northeast ──────────────────────────────────────────
  { clientName:'ABC Creative',                          name:'Meta',           seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:49584   },
  { clientName:'ABC Creative',                          name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:29452   },
  { clientName:'ABC Creative',                          name:'Native',         seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:29452   },
  { clientName:'Bradley MediaWorks',                    name:'Video',          seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:12000   },
  { clientName:'Bradley MediaWorks',                    name:'Display',        seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:18000   },
  { clientName:'Bradley MediaWorks',                    name:'Meta',           seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:15000   },
  { clientName:'Bradley MediaWorks',                    name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'9/30/2026',  budget:25000   },
  { clientName:'Bradley MediaWorks',                    name:'CTV',            seller:'Danielle Whiting', startDate:'12/15/2025', endDate:'7/31/2026',  budget:30000   },
  { clientName:'Bradley MediaWorks',                    name:'Search',         seller:'Danielle Whiting', startDate:'10/1/2025',  endDate:'9/30/2026',  budget:15000   },
  { clientName:'Crowley Webb',                          name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'2/9/2026',   endDate:'12/20/2026', budget:100000  },
  { clientName:'Crowley Webb',                          name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'3/9/2026',   endDate:'5/29/2026',  budget:56250   },
  { clientName:'Crowley Webb',                          name:'Audio',          seller:'Danielle Whiting', startDate:'3/9/2026',   endDate:'5/29/2026',  budget:32500   },
  { clientName:'Crowley Webb : One Fortune Media',      name:'CTV/OTT',        seller:'Danielle Whiting', startDate:'2/9/2026',   endDate:'8/9/2026',   budget:36752   },
  { clientName:'Dixon Schwabl + Company : WNY Media',   name:'Display',        seller:'Danielle Whiting', startDate:'3/1/2026',   endDate:'9/30/2026',  budget:49442   },
  { clientName:'FARM',                                  name:'Display',        seller:'Danielle Whiting', startDate:'1/18/2026',  endDate:'12/31/2026', budget:20000   },
  { clientName:'FARM',                                  name:'Video',          seller:'Danielle Whiting', startDate:'1/18/2026',  endDate:'12/31/2026', budget:25000   },
  { clientName:'FARM',                                  name:'Rich Media',     seller:'Danielle Whiting', startDate:'1/18/2026',  endDate:'12/31/2026', budget:25000   },
  { clientName:'Gregson-Clark Spraying Equipment',      name:'YouTube',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'5/15/2026',  budget:7500    },
  { clientName:'Gregson-Clark Spraying Equipment',      name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'5/15/2026',  budget:7500    },
  { clientName:'Nazareth University',                   name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:40000   },
  { clientName:'The Martin Group',                      name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:246500  },
  { clientName:'Wahl Media',                            name:'Display',        seller:'Danielle Whiting', startDate:'1/1/2026',   endDate:'12/31/2026', budget:43000   },

  // ── Steven Miller — Northeast ─────────────────────────────────────────────
  { clientName:'Heartbeat',                             name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Sonsray',                               name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:50500   },
  { clientName:'Vested',                                name:'Display',        seller:'Steven Miller',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:137500  },

  // ── Grayson Vickers — Northeast ───────────────────────────────────────────
  { clientName:'GWP',                                   name:'YouTube',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:24000   },
  { clientName:'GWP',                                   name:'CTV/OTT',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:78219   },
  { clientName:'GWP',                                   name:'CTV',            seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:126000  },
  { clientName:'Liberty Concepts',                      name:'Display',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:25781   },
  { clientName:'North American Entertainment Group',    name:'Display',        seller:'Grayson Vickers',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:22800   },

  // ── Amy Murray — Northeast ────────────────────────────────────────────────
  { clientName:'AdsIntelligence',                       name:'CTV',            seller:'Amy Murray',       startDate:'2/10/2026',  endDate:'6/30/2026',  budget:95000   },
  { clientName:'AdsIntelligence',                       name:'Audio',          seller:'Amy Murray',       startDate:'2/10/2026',  endDate:'6/30/2026',  budget:25000   },
  { clientName:'AdsIntelligence',                       name:'CTV',            seller:'Amy Murray',       startDate:'3/1/2026',   endDate:'5/31/2026',  budget:85000   },
  { clientName:'Smith Gifford : Association for Financial Professionals', name:'Display', seller:'Amy Murray', startDate:'1/1/2026', endDate:'12/31/2026', budget:66350 },

  // ── Cailin Murphy — Northeast ─────────────────────────────────────────────
  { clientName:'Duffy & Shanley',                       name:'YouTube',        seller:'Cailin Murphy',    startDate:'3/16/2026',  endDate:'5/14/2026',  budget:2000    },
  { clientName:'McGuinness Media',                      name:'Display',        seller:'Cailin Murphy',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:111500  },
  { clientName:'Team Lewis',                            name:'Display',        seller:'Cailin Murphy',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:52000   },

  // ── Scott Welton — Southeast ──────────────────────────────────────────────
  { clientName:'Creative Fuel',                         name:'YouTube',        seller:'Scott Welton',     startDate:'4/1/2026',   endDate:'9/30/2026',  budget:8800    },
  { clientName:'Creative Fuel',                         name:'CTV/OTT',        seller:'Scott Welton',     startDate:'4/1/2026',   endDate:'9/30/2026',  budget:12750   },
  { clientName:'Creative Fuel',                         name:'Video',          seller:'Scott Welton',     startDate:'4/1/2026',   endDate:'9/30/2026',  budget:13600   },
  { clientName:'FKQ',                                   name:'YouTube',        seller:'Scott Welton',     startDate:'3/31/2026',  endDate:'7/19/2026',  budget:4000    },
  { clientName:'FKQ',                                   name:'CTV',            seller:'Scott Welton',     startDate:'3/31/2026',  endDate:'7/19/2026',  budget:7000    },
  { clientName:'FKQ',                                   name:'Video',          seller:'Scott Welton',     startDate:'3/31/2026',  endDate:'7/19/2026',  budget:3000    },
  { clientName:'Lamont Digital',                        name:'Display',        seller:'Scott Welton',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:1036000 },
  { clientName:'Mediagistic',                           name:'Display',        seller:'Scott Welton',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:717785  },
  { clientName:'Mosaic Advertising',                    name:'Display',        seller:'Scott Welton',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:50000   },

  // ── Larry Tucker — Southeast ──────────────────────────────────────────────
  { clientName:'3Headed Monster : Yum! Brands',         name:'TikTok',         seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:22000   },
  { clientName:'3Headed Monster : Yum! Brands',         name:'YouTube',        seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:14600   },
  { clientName:'3Headed Monster : Yum! Brands',         name:'Meta',           seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:14000   },
  { clientName:'3Headed Monster : Yum! Brands',         name:'DOOH',           seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:17000   },
  { clientName:'3Headed Monster : Yum! Brands',         name:'Display',        seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:20000   },
  { clientName:'3Headed Monster : Yum! Brands',         name:'Video',          seller:'Larry Tucker',     startDate:'3/23/2026',  endDate:'6/1/2026',   budget:33000   },
  { clientName:'Culture Pilots',                        name:'Video',          seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1500    },
  { clientName:'Culture Pilots',                        name:'Display',        seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1500    },
  { clientName:'Gilbreath Communications',              name:'Display',        seller:'Larry Tucker',     startDate:'2/16/2026',  endDate:'5/20/2026',  budget:7231    },
  { clientName:'Gilbreath Communications',              name:'Meta',           seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:5801    },
  { clientName:'Gilbreath Communications',              name:'Google Search',  seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/20/2026',  budget:7000    },
  { clientName:'Gilbreath Communications',              name:'LinkedIn',       seller:'Larry Tucker',     startDate:'2/16/2026',  endDate:'5/20/2026',  budget:4000    },
  { clientName:'Gilbreath Communications',              name:'Google Search',  seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1934    },
  { clientName:'Gilbreath Communications',              name:'Meta',           seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/20/2026',  budget:7000    },
  { clientName:'Gilbreath Communications',              name:'Google Search',  seller:'Larry Tucker',     startDate:'2/16/2026',  endDate:'5/20/2026',  budget:8001    },
  { clientName:'Gilbreath Communications',              name:'Native',         seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/20/2026',  budget:5231    },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'Google Search',  seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/24/2026',  budget:3000    },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'YouTube',        seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:22000   },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'Meta',           seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/24/2026',  budget:4000    },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'Display',        seller:'Larry Tucker',     startDate:'4/1/2026',   endDate:'5/24/2026',  budget:8000    },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'Display',        seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:33000   },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'CTV/OTT',        seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:22000   },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'Meta',           seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:11000   },
  { clientName:'Grapevine Convention & Visitors Bureau',name:'Google Search',  seller:'Larry Tucker',     startDate:'3/1/2026',   endDate:'9/30/2026',  budget:63500   },
  { clientName:'The Lee Group',                         name:'Display',        seller:'Larry Tucker',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:17100   },
  { clientName:'TruHearing',                            name:'Display',        seller:'Larry Tucker',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },

  // ── Kelly Calderone — Southeast ───────────────────────────────────────────
  { clientName:'Curiosity Marketing',                   name:'Native',         seller:'Kelly Calderone',  startDate:'2/26/2026',  endDate:'5/25/2026',  budget:3000    },
  { clientName:'Intrinsic Media',                       name:'Display',        seller:'Kelly Calderone',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:81273   },
  { clientName:'Portside Advertising',                  name:'Display',        seller:'Kelly Calderone',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:181300  },

  // ── Jodie Dover — Southeast ───────────────────────────────────────────────
  { clientName:'Helms Workshop',                        name:'Display',        seller:'Jodie Dover',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:300000  },
  { clientName:'Hooky Entertainment',                   name:'Display',        seller:'Jodie Dover',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:718503  },
  { clientName:'Meals on Wheels CTX',                   name:'Display',        seller:'Jodie Dover',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'New Braunfels CVB',                     name:'Display',        seller:'Jodie Dover',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:664318  },
  { clientName:'SandersWingo',                          name:'Display',        seller:'Jodie Dover',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:324000  },
  { clientName:"St. Edward's University",               name:'Display',        seller:'Jodie Dover',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:743817  },

  // ── Shane Miller — Southeast ──────────────────────────────────────────────
  { clientName:'Johnson Group',                         name:'Display',        seller:'Shane Miller',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:19723   },
  { clientName:'PPK',                                   name:'Display',        seller:'Shane Miller',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:1888955 },
  { clientName:'TDS Marketing Group : Trinchero Family Estates', name:'Display', seller:'Shane Miller',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:15000   },

  // ── Ramon Brayan — Southeast ──────────────────────────────────────────────
  { clientName:'Redline Media Group',                   name:'Display',        seller:'Ramon Brayan',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:14447   },
  { clientName:'Rouge Wave Agency',                     name:'Display',        seller:'Ramon Brayan',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:132000  },

  // ── Amy O'Hara — Midwest ──────────────────────────────────────────────────
  { clientName:'Agri Sciences Biologicals USA LLC',     name:'Native',         seller:"Amy O'Hara",       startDate:'3/16/2026',  endDate:'7/31/2026',  budget:10800   },
  { clientName:'Agri Sciences Biologicals USA LLC',     name:'Native Video',   seller:"Amy O'Hara",       startDate:'3/16/2026',  endDate:'7/31/2026',  budget:16200   },
  { clientName:'Agri Sciences Biologicals USA LLC',     name:'Video',          seller:"Amy O'Hara",       startDate:'3/16/2026',  endDate:'7/31/2026',  budget:18600   },
  { clientName:'Bader Rutter',                          name:'Display',        seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:21505   },
  { clientName:'Bader Rutter',                          name:'Display',        seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:13930   },
  { clientName:'Bader Rutter',                          name:'Display',        seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'5/31/2026',  budget:25100   },
  { clientName:'Bader Rutter',                          name:'Display',        seller:"Amy O'Hara",       startDate:'4/1/2026',   endDate:'6/30/2026',  budget:28000   },
  { clientName:'Bader Rutter',                          name:'CTV',            seller:"Amy O'Hara",       startDate:'2/2/2026',   endDate:'8/31/2026',  budget:103000  },
  { clientName:'Bader Rutter',                          name:'Video',          seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:12375   },
  { clientName:'Bader Rutter',                          name:'Video',          seller:"Amy O'Hara",       startDate:'2/2/2026',   endDate:'8/31/2026',  budget:15000   },
  { clientName:'Bader Rutter',                          name:'Audio',          seller:"Amy O'Hara",       startDate:'1/26/2026',  endDate:'4/26/2026',  budget:20000   },
  { clientName:'Bader Rutter',                          name:'Audio',          seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'5/31/2026',  budget:29400   },
  { clientName:'Bader Rutter',                          name:'CTV Live Sports',seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:18725   },
  { clientName:'Bader Rutter',                          name:'Audio',          seller:"Amy O'Hara",       startDate:'2/1/2026',   endDate:'12/31/2026', budget:19600   },
  { clientName:'Bader Rutter',                          name:'Video',          seller:"Amy O'Hara",       startDate:'11/10/2025', endDate:'5/31/2026',  budget:72341   },
  { clientName:'Dearing Group',                         name:'CTV',            seller:"Amy O'Hara",       startDate:'3/4/2026',   endDate:'5/31/2026',  budget:6000    },
  { clientName:'Dearing Group',                         name:'Display',        seller:"Amy O'Hara",       startDate:'3/4/2026',   endDate:'5/31/2026',  budget:3000    },
  { clientName:'John Deere',                            name:'Display',        seller:"Amy O'Hara",       startDate:'1/1/2026',   endDate:'12/31/2026', budget:1067304 },
  { clientName:'Rhycom',                                name:'Display',        seller:"Amy O'Hara",       startDate:'1/1/2026',   endDate:'12/31/2026', budget:70550   },
  { clientName:'Strategic America',                     name:'Display',        seller:"Amy O'Hara",       startDate:'1/1/2026',   endDate:'12/31/2026', budget:2703372 },
  { clientName:'Ten Acre Marketing',                    name:'Display',        seller:"Amy O'Hara",       startDate:'1/1/2026',   endDate:'12/31/2026', budget:158702  },
  { clientName:'Walz Tetrick',                          name:'Display',        seller:"Amy O'Hara",       startDate:'1/1/2026',   endDate:'12/31/2026', budget:52500   },
  { clientName:'Wyffels',                               name:'Display',        seller:"Amy O'Hara",       startDate:'1/1/2026',   endDate:'12/31/2026', budget:125591  },

  // ── Jill Puerto — Midwest ─────────────────────────────────────────────────
  { clientName:'BlueSnap',                              name:'CTV',            seller:'Jill Puerto',      startDate:'4/1/2026',   endDate:'6/30/2026',  budget:8000    },
  { clientName:'BlueSnap',                              name:'Video',          seller:'Jill Puerto',      startDate:'4/1/2026',   endDate:'6/30/2026',  budget:4000    },
  { clientName:'Connelly Partners',                     name:'CTV',            seller:'Jill Puerto',      startDate:'10/1/2025',  endDate:'9/30/2026',  budget:250944  },
  { clientName:'Connelly Partners',                     name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'10/1/2025',  endDate:'9/30/2026',  budget:290000  },
  { clientName:'DCG One',                               name:'Display',        seller:'Jill Puerto',      startDate:'3/25/2026',  endDate:'6/30/2026',  budget:12500   },
  { clientName:'DCG One',                               name:'Display',        seller:'Jill Puerto',      startDate:'2/1/2026',   endDate:'6/30/2026',  budget:10000   },
  { clientName:'Decibel Media',                         name:'Native',         seller:'Jill Puerto',      startDate:'8/1/2025',   endDate:'5/31/2026',  budget:100235  },
  { clientName:'Decibel Media',                         name:'Rich Media',     seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:14000   },
  { clientName:'Decibel Media',                         name:'TikTok',         seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:15000   },
  { clientName:'Decibel Media',                         name:'Native',         seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:46388   },
  { clientName:'Decibel Media',                         name:'Display',        seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:60836   },
  { clientName:'Decibel Media',                         name:'CTV/OTT',        seller:'Jill Puerto',      startDate:'8/18/2025',  endDate:'6/30/2026',  budget:43000   },
  { clientName:'Freelance Media Services',              name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'4/30/2026',  budget:5500    },
  { clientName:'Freelance Media Services',              name:'Video',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'4/30/2026',  budget:3500    },
  { clientName:'Freelance Media Services',              name:'Audio',          seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'4/30/2026',  budget:5500    },
  { clientName:'Makiaris Media',                        name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:175000  },
  { clientName:'o2kl',                                  name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:146500  },
  { clientName:'RDW Group',                             name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:27890   },
  { clientName:'Sean Tracey Associates',                name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:39304   },
  { clientName:'Vermont Federal Credit Union',          name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:180000  },
  { clientName:'Wheelhouse',                            name:'Display',        seller:'Jill Puerto',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:510000  },

  // ── Sophie Denault — Midwest ──────────────────────────────────────────────
  { clientName:'M5',                                    name:'Display',        seller:'Sophie Denault',   startDate:'1/1/2026',   endDate:'12/31/2026', budget:121959  },
  { clientName:'Oasis Communications',                  name:'Display',        seller:'Sophie Denault',   startDate:'1/1/2026',   endDate:'12/31/2026', budget:144100  },
  { clientName:'Republik',                              name:'Display',        seller:'Sophie Denault',   startDate:'1/1/2026',   endDate:'12/31/2026', budget:7310    },

  // ── Grace Dominique — Midwest ─────────────────────────────────────────────
  { clientName:'Flint Group',                           name:'CTV',            seller:'Grace Dominique',  startDate:'2/10/2026',  endDate:'12/31/2026', budget:5100    },
  { clientName:'Flint Group',                           name:'Display',        seller:'Grace Dominique',  startDate:'2/10/2026',  endDate:'12/31/2026', budget:1700    },
  { clientName:'Local Werks',                           name:'Display',        seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:10500   },
  { clientName:'MKR',                                   name:'Display',        seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:92600   },
  { clientName:'Resonate Marketing Studios',            name:'Display',        seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:81690   },
  { clientName:'The Digital Ring',                      name:'Display',        seller:'Grace Dominique',  startDate:'1/1/2026',   endDate:'12/31/2026', budget:55470   },

  // ── Katie Johnson — Midwest ───────────────────────────────────────────────
  { clientName:'Curious Plot',                          name:'Display',        seller:'Katie Johnson',    startDate:'3/13/2026',  endDate:'3/31/2027',  budget:17550   },
  { clientName:'Karma Group',                           name:'Display',        seller:'Katie Johnson',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:105712  },
  { clientName:'Pixel and Plume',                       name:'Display',        seller:'Katie Johnson',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:362545  },
  { clientName:'True Media',                            name:'Display',        seller:'Katie Johnson',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:46000   },

  // ── Stephanie Jurney — Central ────────────────────────────────────────────
  { clientName:'Accelerate Impact Digital',             name:'Audio',          seller:'Stephanie Jurney', startDate:'3/26/2026',  endDate:'12/31/2026', budget:11875   },
  { clientName:'Accelerate Impact Digital',             name:'Audio',          seller:'Stephanie Jurney', startDate:'11/3/2025',  endDate:'11/30/2026', budget:13000   },
  { clientName:'Avenir Bold',                           name:'TikTok',         seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:23000   },
  { clientName:'Avenir Bold',                           name:'Meta',           seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:22500   },
  { clientName:'Avenir Bold',                           name:'Video',          seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:13000   },
  { clientName:'Avenir Bold',                           name:'YouTube',        seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:32000   },
  { clientName:'Avenir Bold',                           name:'Display',        seller:'Stephanie Jurney', startDate:'4/15/2026',  endDate:'11/30/2026', budget:9000    },
  { clientName:'Avenir Bold',                           name:'Native',         seller:'Stephanie Jurney', startDate:'3/16/2026',  endDate:'6/15/2026',  budget:3825    },
  { clientName:'French West Vaughan',                   name:'Display',        seller:'Stephanie Jurney', startDate:'1/1/2026',   endDate:'11/30/2026', budget:20300   },
  { clientName:'French West Vaughan',                   name:'Video',          seller:'Stephanie Jurney', startDate:'1/1/2026',   endDate:'11/30/2026', budget:8700    },
  { clientName:'Reuben Rink',                           name:'Display',        seller:'Stephanie Jurney', startDate:'1/1/2026',   endDate:'12/31/2026', budget:234200  },
  { clientName:'The Padgett Smith Project',             name:'Display',        seller:'Stephanie Jurney', startDate:'1/1/2026',   endDate:'12/31/2026', budget:547185  },

  // ── Ross Peters — Central ─────────────────────────────────────────────────
  { clientName:'Agency GWL',                            name:'Google Search',  seller:'Ross Peters',      startDate:'4/1/2026',   endDate:'4/30/2026',  budget:12250   },
  { clientName:'Agency Pure',                           name:'Display',        seller:'Ross Peters',      startDate:'2/9/2026',   endDate:'6/30/2026',  budget:7500    },
  { clientName:'Agency Pure',                           name:'Video',          seller:'Ross Peters',      startDate:'2/9/2026',   endDate:'6/30/2026',  budget:7500    },
  { clientName:'CJRW',                                  name:'Display',        seller:'Ross Peters',      startDate:'8/28/2025',  endDate:'6/30/2026',  budget:38068   },
  { clientName:'CJRW',                                  name:'Display',        seller:'Ross Peters',      startDate:'1/26/2026',  endDate:'11/22/2026', budget:70298   },
  { clientName:'CJRW',                                  name:'Video',          seller:'Ross Peters',      startDate:'1/26/2026',  endDate:'11/22/2026', budget:60098   },
  { clientName:'CJRW',                                  name:'Video',          seller:'Ross Peters',      startDate:'8/28/2025',  endDate:'6/30/2026',  budget:114204  },
  { clientName:'CJRW',                                  name:'CTV/OTT',        seller:'Ross Peters',      startDate:'1/26/2026',  endDate:'11/22/2026', budget:125375  },
  { clientName:'Cranford and Co',                       name:'Display',        seller:'Ross Peters',      startDate:'4/21/2026',  endDate:'11/22/2026', budget:24000   },
  { clientName:'Cranford and Co',                       name:'CTV/OTT',        seller:'Ross Peters',      startDate:'2/23/2026',  endDate:'6/30/2026',  budget:23800   },
  { clientName:'Cranford and Co',                       name:'CTV/OTT',        seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'6/7/2026',   budget:89896   },
  { clientName:'Cranford and Co',                       name:'Display',        seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'10/25/2026', budget:38114   },
  { clientName:'Cranford and Co',                       name:'CTV',            seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'6/7/2026',   budget:29965   },
  { clientName:'Cranford and Co',                       name:'Video',          seller:'Ross Peters',      startDate:'3/2/2026',   endDate:'10/25/2026', budget:51566   },
  { clientName:'Cranford and Co',                       name:'DOOH',           seller:'Ross Peters',      startDate:'4/21/2026',  endDate:'11/22/2026', budget:8000    },
  { clientName:'Metropolis Technologies',               name:'Display',        seller:'Ross Peters',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:855000  },
  { clientName:'Romph & Pou',                           name:'Display',        seller:'Ross Peters',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:159599  },

  // ── Jenny DeBono — Central ────────────────────────────────────────────────
  { clientName:'Anson Stoner',                          name:'CTV/OTT',        seller:'Jenny DeBono',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:25725   },
  { clientName:'Dalton Agency',                         name:'Display',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:13600   },
  { clientName:'Dalton Agency',                         name:'YouTube',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:11280   },
  { clientName:'Dalton Agency',                         name:'CTV Live Sports',seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:20000   },
  { clientName:'Dalton Agency',                         name:'Video',          seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:29205   },
  { clientName:'Dalton Agency',                         name:'Rich Media',     seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:31200   },
  { clientName:'Dalton Agency',                         name:'Native Video',   seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:28950   },
  { clientName:'Dalton Agency',                         name:'CTV/OTT',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:40000   },
  { clientName:'Dalton Agency',                         name:'Native',         seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:32750   },
  { clientName:'Dalton Agency',                         name:'Audio',          seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:14000   },
  { clientName:'Holdsworth & Nicholas',                 name:'Display',        seller:'Jenny DeBono',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:242043  },

  // ── Scott Wright — Central ────────────────────────────────────────────────
  { clientName:'Bullseye Strategy',                     name:'CTV/OTT',        seller:'Scott Wright',     startDate:'3/25/2026',  endDate:'4/26/2026',  budget:3350    },
  { clientName:'Bullseye Strategy',                     name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:18480   },
  { clientName:'Bullseye Strategy',                     name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:5500    },
  { clientName:'Bullseye Strategy',                     name:'Display',        seller:'Scott Wright',     startDate:'3/1/2026',   endDate:'4/30/2026',  budget:1650    },
  { clientName:'Crackerjack Media',                     name:'Audio',          seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:12750   },
  { clientName:'Crackerjack Media',                     name:'Display',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:19125   },
  { clientName:'Crackerjack Media',                     name:'Video',          seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:7650    },
  { clientName:'Crackerjack Media',                     name:'Display',        seller:'Scott Wright',     startDate:'2/2/2026',   endDate:'5/6/2026',   budget:5000    },
  { clientName:'Crackerjack Media',                     name:'Display',        seller:'Scott Wright',     startDate:'12/15/2025', endDate:'8/30/2026',  budget:12000   },
  { clientName:'Crackerjack Media',                     name:'YouTube',        seller:'Scott Wright',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:11475   },
  { clientName:'Fieldtrip',                             name:'Display',        seller:'Scott Wright',     startDate:'3/16/2026',  endDate:'6/15/2026',  budget:8000    },
  { clientName:'Hedy & Hopp',                           name:'Display',        seller:'Scott Wright',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:5000    },

  // ── Gargi Bhakta — Central ────────────────────────────────────────────────
  { clientName:'Davis South Barnette & Patrick',        name:'CTV',            seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:31000   },
  { clientName:'Davis South Barnette & Patrick',        name:'Display',        seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:72292   },
  { clientName:'Davis South Barnette & Patrick',        name:'Google Search',  seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:138740  },
  { clientName:'Davis South Barnette & Patrick',        name:'Display',        seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:152680  },
  { clientName:'Davis South Barnette & Patrick',        name:'CTV/OTT',        seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:39447   },
  { clientName:'Davis South Barnette & Patrick',        name:'CTV',            seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:31261   },
  { clientName:'Davis South Barnette & Patrick',        name:'Native',         seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:102674  },
  { clientName:'Davis South Barnette & Patrick',        name:'Native',         seller:'Gargi Bhakta',     startDate:'1/1/2026',   endDate:'6/30/2026',  budget:22800   },

  // ── Matt Musgrave — Central ───────────────────────────────────────────────
  { clientName:'Jones PR',                              name:'Display',        seller:'Matt Musgrave',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:75000   },
  { clientName:'WandB Partners',                        name:'Display',        seller:'Matt Musgrave',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:15000   },

  // ── Dayna Schram — Central ────────────────────────────────────────────────
  { clientName:'ICG',                                   name:'Display',        seller:'Dayna Schram',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:86162   },
  { clientName:'Pegasus Media & Entertainment',         name:'Display',        seller:'Dayna Schram',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:94058   },
  { clientName:'TCL',                                   name:'Display',        seller:'Dayna Schram',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:3207795 },

  // ── Lane Johnson — Central ────────────────────────────────────────────────
  { clientName:'Laynes Chicken Fingers',                name:'Display',        seller:'Lane Johnson',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:800000  },
  { clientName:'Northwestern Mutual',                   name:'Display',        seller:'Lane Johnson',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:153258  },

  // ── Tessa Walsh — West ────────────────────────────────────────────────────
  { clientName:'Conroy Media',                          name:'Display',        seller:'Tessa Walsh',      startDate:'3/19/2026',  endDate:'4/19/2026',  budget:18725   },
  { clientName:'Kick Media',                            name:'Display',        seller:'Tessa Walsh',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:16186   },
  { clientName:'Northwest State Community College',     name:'Display',        seller:'Tessa Walsh',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:30000   },
  { clientName:'REQ',                                   name:'Display',        seller:'Tessa Walsh',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:5000    },
  { clientName:'True Media Canada',                     name:'Display',        seller:'Tessa Walsh',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:67182   },
  { clientName:'UpBrand',                               name:'Display',        seller:'Tessa Walsh',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:613350  },

  // ── Josh Darden — West ────────────────────────────────────────────────────
  { clientName:'Hippo Media',                           name:'Display',        seller:'Josh Darden',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:108000  },
  { clientName:'Ideas Collide',                         name:'Display',        seller:'Josh Darden',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:150000  },
  { clientName:'Lisa Scott Communications',             name:'Display',        seller:'Josh Darden',      startDate:'1/1/2026',   endDate:'12/31/2026', budget:906250  },

  // ── Joshua Gallo — West ───────────────────────────────────────────────────
  { clientName:'Explore Communications',                name:'Display',        seller:'Joshua Gallo',     startDate:'3/30/2026',  endDate:'11/1/2026',  budget:12000   },
  { clientName:'MCA Denver',                            name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:3500    },
  { clientName:'Merit Strategy',                        name:'Display',        seller:'Joshua Gallo',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:38000   },

  // ── Jacob Kearney — West ──────────────────────────────────────────────────
  { clientName:'Gud Marketing',                         name:'CTV Live Sports',seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'9/30/2026',  budget:63000   },
  { clientName:'Gud Marketing',                         name:'CTV/OTT',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'9/30/2026',  budget:70000   },
  { clientName:'MQ&C',                                  name:'Display',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:9350    },
  { clientName:'Seattle Reign FC',                      name:'Display',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:257000  },
  { clientName:'Seattle Sounders FC',                   name:'Display',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:440200  },
  { clientName:'Senior Helpers',                        name:'Display',        seller:'Jacob Kearney',    startDate:'1/1/2026',   endDate:'12/31/2026', budget:1700645 },

  // ── Jeff DePew — West ─────────────────────────────────────────────────────
  { clientName:'eMedia Marketing Solutions',            name:'Display',        seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'4/30/2026',  budget:2400    },
  { clientName:'eMedia Marketing Solutions',            name:'CTV/OTT',        seller:'Jeff DePew',       startDate:'4/1/2026',   endDate:'4/30/2026',  budget:3200    },
  { clientName:'eMedia Marketing Solutions',            name:'CTV',            seller:'Jeff DePew',       startDate:'4/2/2026',   endDate:'7/31/2026',  budget:19200   },
  { clientName:'Hyphen',                                name:'Display',        seller:'Jeff DePew',       startDate:'1/1/2026',   endDate:'12/31/2026', budget:57391   },
  { clientName:'JNS Next',                              name:'Display',        seller:'Jeff DePew',       startDate:'1/1/2026',   endDate:'12/31/2026', budget:68722   },

  // ── Kyle McBride — West ───────────────────────────────────────────────────
  { clientName:'nutpods',                               name:'Display',        seller:'Kyle McBride',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:638161  },
  { clientName:'Workshop Digital : Ronald McDonald House Charities Richmond', name:'Display', seller:'Kyle McBride', startDate:'1/1/2026', endDate:'12/31/2026', budget:3000 },
  { clientName:'Workshop Digital : S&P Global',         name:'Display',        seller:'Kyle McBride',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:20000   },

  // ── Adriana Richards — West ───────────────────────────────────────────────
  { clientName:'Bio-Techne',                            name:'Display',        seller:'Adriana Richards', startDate:'3/12/2026',  endDate:'6/30/2026',  budget:3500    },
  { clientName:'Bio-Techne',                            name:'Display',        seller:'Adriana Richards', startDate:'3/20/2026',  endDate:'6/30/2026',  budget:3500    },
  { clientName:'Bio-Techne',                            name:'Display',        seller:'Adriana Richards', startDate:'3/27/2026',  endDate:'6/30/2026',  budget:4500    },
  { clientName:'Bio-Techne',                            name:'Display',        seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:11000   },
  { clientName:'Dean Houston',                          name:'Display',        seller:'Adriana Richards', startDate:'3/26/2026',  endDate:'7/3/2026',   budget:3000    },
  { clientName:'Dean Houston',                          name:'Video',          seller:'Adriana Richards', startDate:'3/26/2026',  endDate:'7/3/2026',   budget:5000    },
  { clientName:'Dean Houston',                          name:'Display',        seller:'Adriana Richards', startDate:'2/27/2026',  endDate:'4/19/2026',  budget:2350    },
  { clientName:'First City Credit Union',               name:'Display',        seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:8250    },
  { clientName:'First City Credit Union',               name:'CTV/OTT',        seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:10250   },
  { clientName:'First City Credit Union',               name:'Video',          seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:7000    },
  { clientName:'First City Credit Union',               name:'Native',         seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:4500    },
  { clientName:'First City Credit Union',               name:'Google Search',  seller:'Adriana Richards', startDate:'4/1/2026',   endDate:'6/30/2026',  budget:15000   },
  { clientName:'Homemade Pasta',                        name:'Display',        seller:'Adriana Richards', startDate:'1/1/2026',   endDate:'12/31/2026', budget:126000  },

  // ── Michael Bell — Political ──────────────────────────────────────────────
  { clientName:'Hilton Multimedia',                     name:'Display',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:6903    },
  { clientName:'Opus Broadcasting',                     name:'Display',        seller:'Michael Bell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:12240   },

  // ── Nicole Meade — Political ──────────────────────────────────────────────
  { clientName:'Blue Chair',                            name:'DOOH',           seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:81250   },
  { clientName:'Blue Chair',                            name:'Live Sports',    seller:'Nicole Meade',     startDate:'1/12/2026',  endDate:'12/31/2026', budget:34000   },
  { clientName:'Blue Chair',                            name:'CTV/OTT',        seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:50000   },
  { clientName:'Blue Chair',                            name:'Live Sports',    seller:'Nicole Meade',     startDate:'3/13/2026',  endDate:'12/31/2026', budget:34000   },
  { clientName:'Blue Chair',                            name:'Live Sports',    seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:76500   },
  { clientName:'Blue Chair',                            name:'Audio',          seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:42500   },
  { clientName:'Blue Chair',                            name:'Video',          seller:'Nicole Meade',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:60000   },
  { clientName:'Blue Chair',                            name:'Video',          seller:'Nicole Meade',     startDate:'1/12/2026',  endDate:'12/31/2026', budget:71400   },

  // ── Jonathan Phelps — Political ───────────────────────────────────────────
  { clientName:'DCI Group',                             name:'CTV/OTT',        seller:'Jonathan Phelps',  startDate:'3/3/2026',   endDate:'4/30/2026',  budget:9600    },

  // ── Thomas Buell — Regional Majors ────────────────────────────────────────
  { clientName:'Barbauld Agency',                       name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:1500    },
  { clientName:'Barbauld Agency',                       name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:500     },
  { clientName:'Barbauld Agency',                       name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:1500    },
  { clientName:'Barbauld Agency',                       name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'6/30/2026',  budget:1500    },
  { clientName:'Brandera',                              name:'Display',        seller:'Thomas Buell',     startDate:'2/19/2026',  endDate:'9/30/2026',  budget:17850   },
  { clientName:'Brandera',                              name:'Display',        seller:'Thomas Buell',     startDate:'3/29/2026',  endDate:'6/18/2026',  budget:18350   },
  { clientName:'Brandera',                              name:'Display',        seller:'Thomas Buell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:12900   },
  { clientName:'DeMeyer Furniture',                     name:'CTV',            seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'12/31/2026', budget:27000   },
  { clientName:'DeMeyer Furniture',                     name:'Display',        seller:'Thomas Buell',     startDate:'4/1/2026',   endDate:'12/31/2026', budget:67500   },
  { clientName:'The Barber Shop Marketing',             name:'Display',        seller:'Thomas Buell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:13320   },
  { clientName:'Vobile Inc.',                           name:'Display',        seller:'Thomas Buell',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:30000   },

  // ── Greg Kupfner — Regional Majors ────────────────────────────────────────
  { clientName:'CAS Cable',                             name:'Video',          seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1000    },
  { clientName:'CAS Cable',                             name:'CTV/OTT',        seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:2000    },
  { clientName:'CAS Cable',                             name:'Display',        seller:'Greg Kupfner',     startDate:'4/1/2026',   endDate:'4/30/2026',  budget:1000    },
  { clientName:'Conquest Media Group',                  name:'CTV',            seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:11000   },
  { clientName:'Conquest Media Group',                  name:'CTV/OTT',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:17040   },
  { clientName:'Conquest Media Group',                  name:'Display',        seller:'Greg Kupfner',     startDate:'3/3/2026',   endDate:'12/31/2026', budget:7600    },
  { clientName:'Conquest Media Group',                  name:'Display',        seller:'Greg Kupfner',     startDate:'3/1/2026',   endDate:'12/31/2026', budget:4800    },
  { clientName:'Conquest Media Group',                  name:'CTV',            seller:'Greg Kupfner',     startDate:'3/3/2026',   endDate:'12/31/2026', budget:9600    },
  { clientName:'Conquest Media Group',                  name:'Display',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:6650    },
  { clientName:'Conquest Media Group',                  name:'Display',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:8550    },
  { clientName:'Conquest Media Group',                  name:'Display',        seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:6650    },
  { clientName:'Conquest Media Group',                  name:'CTV',            seller:'Greg Kupfner',     startDate:'3/4/2026',   endDate:'12/31/2026', budget:11000   },

  // ── Andrew Davis — Regional Majors ────────────────────────────────────────
  { clientName:'Liechty Auto Group',                    name:'Display',        seller:'Andrew Davis',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:171300  },
  { clientName:'Real Talk Communications',              name:'Display',        seller:'Andrew Davis',     startDate:'1/1/2026',   endDate:'12/31/2026', budget:12000   },

  // ── Geoff Halsema — Retail Solutions ──────────────────────────────────────
  { clientName:'Fox Dealer',                            name:'CTV',            seller:'Geoff Halsema',    startDate:'4/14/2026',  endDate:'6/30/2026',  budget:144000  },

  // ── Andy Kemp — Retail Solutions ─────────────────────────────────────────
  { clientName:'Lazy Boy Agency',                       name:'Display',        seller:'Andy Kemp',        startDate:'1/1/2026',   endDate:'12/31/2026', budget:312439  },
  { clientName:'Marcus Thomas',                         name:'Display',        seller:'Andy Kemp',        startDate:'1/1/2026',   endDate:'12/31/2026', budget:240000  },
  { clientName:'USA Marketing Partners',                name:'Display',        seller:'Andy Kemp',        startDate:'1/1/2026',   endDate:'12/31/2026', budget:44742   },

  // ── Daniel Friscia — Retail Solutions ────────────────────────────────────
  { clientName:'The Yaffe Group',                       name:'Display',        seller:'Daniel Friscia',   startDate:'1/1/2026',   endDate:'12/31/2026', budget:27000   },
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
