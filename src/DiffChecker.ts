import {CoverageReport} from './Model/CoverageReport'
import {DiffCoverageReport} from './Model/DiffCoverageReport'
import {CoverageData} from './Model/CoverageData'
import {DiffFileCoverageData} from './Model/DiffFileCoverageData'
import {DiffCoverageData} from './Model/DiffCoverageData'

const increasedCoverageIcon = ':green_circle:'
const decreasedCoverageIcon = ':red_circle:'
const newCoverageIcon = ':sparkles: :new:'
const removedCoverageIcon = ':x:'

export class DiffChecker {
  private diffCoverageReport: DiffCoverageReport = {}
  constructor(
    coverageReportNew: CoverageReport,
    coverageReportOld: CoverageReport
  ) {
    const newO: CoverageReport = {}
    for (var key in coverageReportNew) {
      const ky1 = '/' + key.substring(key.indexOf('hotels'))
      const value = coverageReportNew[key]
      newO[ky1] = value
    }

    const oldO: CoverageReport = {}
    for (var key in coverageReportOld) {
      const ky1 = '/' + key.substring(key.indexOf('hotels'))
      const value = coverageReportOld[key]
      oldO[ky1] = value
    }

    const reportNewKeys = Object.keys(newO)
    const reportOldKeys = Object.keys(oldO)

    const reportKeys = new Set([...reportNewKeys, ...reportOldKeys])
    console.debug(reportKeys, 'reportKeys - modified...')
    for (const filePath of reportKeys) {
      this.diffCoverageReport[filePath] = {
        branches: {
          newPct: this.getPercentage(newO[filePath]?.branches),
          oldPct: this.getPercentage(oldO[filePath]?.branches)
        },
        statements: {
          newPct: this.getPercentage(newO[filePath]?.statements),
          oldPct: this.getPercentage(oldO[filePath]?.statements)
        },
        lines: {
          newPct: this.getPercentage(newO[filePath]?.lines),
          oldPct: this.getPercentage(oldO[filePath]?.lines)
        },
        functions: {
          newPct: this.getPercentage(newO[filePath]?.functions),
          oldPct: this.getPercentage(oldO[filePath]?.functions)
        }
      }
    }
  }

  getCoverageDetails(diffOnly: boolean, currentDirectory: string): string[] {
    const keys = Object.keys(this.diffCoverageReport)
    console.debug(keys, 'keys ...')
    const returnStrings: string[] = []
    for (const key of keys) {
      if (true) {
        returnStrings.push(
          this.createDiffLine(
            key.replace(currentDirectory, ''),
            this.diffCoverageReport[key]
          )
        )
      } else {
        // if (!diffOnly) {
        returnStrings.push(
          ` ${key.replace(currentDirectory, '')} | ${
            this.diffCoverageReport[key].statements.newPct
          } | ${this.diffCoverageReport[key].branches.newPct} | ${
            this.diffCoverageReport[key].functions.newPct
          } | ${this.diffCoverageReport[key].lines.newPct}`
        )
      }
      // }
    }
    return returnStrings
  }

  checkIfTestCoverageFallsBelowDelta(delta: number): boolean {
    const keys = Object.keys(this.diffCoverageReport)
    for (const key of keys) {
      const diffCoverageData = this.diffCoverageReport[key]
      const keys: ('lines' | 'statements' | 'branches' | 'functions')[] = <
        ('lines' | 'statements' | 'branches' | 'functions')[]
      >Object.keys(diffCoverageData)
      for (const key of keys) {
        if (diffCoverageData[key].oldPct !== diffCoverageData[key].newPct) {
          if (-this.getPercentageDiff(diffCoverageData[key]) > delta) {
            return true
          }
        }
      }
    }

    return false
  }

  private createDiffLine(
    name: string,
    diffFileCoverageData: DiffFileCoverageData
  ): string {
    // No old coverage found so that means we added a new file coverage
    const fileNewCoverage = Object.values(diffFileCoverageData).every(
      coverageData => coverageData.oldPct === 0
    )
    // No new coverage found so that means we deleted a file coverage
    const fileRemovedCoverage = Object.values(diffFileCoverageData).every(
      coverageData => coverageData.newPct === 0
    )
    if (fileNewCoverage) {
      return ` **${name}** | **${diffFileCoverageData.statements.newPct}** | **${diffFileCoverageData.branches.newPct}** | **${diffFileCoverageData.functions.newPct}** | **${diffFileCoverageData.lines.newPct}**`
    } else if (fileRemovedCoverage) {
      return `  ~~${name}~~ | ~~${diffFileCoverageData.statements.oldPct}~~ | ~~${diffFileCoverageData.branches.oldPct}~~ | ~~${diffFileCoverageData.functions.oldPct}~~ | ~~${diffFileCoverageData.lines.oldPct}~~`
    }
    // Coverage existed before so calculate the diff status
    // const statusIcon = this.getStatusIcon(diffFileCoverageData)
    return ` ${name} | ${
      diffFileCoverageData.statements.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.statements)})** | ${
      diffFileCoverageData.branches.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.branches)})** | ${
      diffFileCoverageData.functions.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.functions)})** | ${
      diffFileCoverageData.lines.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.lines)})**`
  }

  // private compareCoverageValues(
  //   diffCoverageData: DiffFileCoverageData
  // ): number {
  //   const keys: ('lines' | 'statements' | 'branches' | 'functions')[] = <
  //     ('lines' | 'statements' | 'branches' | 'functions')[]
  //   >Object.keys(diffCoverageData)
  //   for (const key of keys) {
  //     console.log(diffCoverageData[key], 'old- new pct ...')
  //     if (diffCoverageData[key].oldPct !== diffCoverageData[key].newPct) {
  //       return 1
  //     }
  //   }
  //   return 0
  // }

  private getPercentage(coverageData: CoverageData): number {
    return coverageData?.pct || 0
  }

  private getStatusIcon(
    diffFileCoverageData: DiffFileCoverageData
  ): ':green_circle:' | ':red_circle:' {
    let overallDiff = 0
    Object.values(diffFileCoverageData).forEach(coverageData => {
      overallDiff = overallDiff + this.getPercentageDiff(coverageData)
    })
    if (overallDiff < 0) {
      return decreasedCoverageIcon
    }
    return increasedCoverageIcon
  }

  private getPercentageDiff(diffData: DiffCoverageData): number {
    // get diff
    const diff = Number(diffData.newPct) - Number(diffData.oldPct)
    // round off the diff to 2 decimal places
    return Math.round((diff + Number.EPSILON) * 100) / 100
  }
}
