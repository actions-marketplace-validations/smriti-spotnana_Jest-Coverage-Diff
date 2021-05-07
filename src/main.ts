import {sep, join, resolve} from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {execSync} from 'child_process'
import fs from 'fs'
import {CoverageReport} from './Model/CoverageReport'
import {DiffChecker} from './DiffChecker'

async function run(): Promise<void> {
  try {
    const repoName = github.context.repo.repo
    const repoOwner = github.context.repo.owner
    // const githubToken = core.getInput('accessToken')
    // const fullCoverage = JSON.parse(core.getInput('fullCoverageDiff'))
    // const commandToRun = core.getInput('runCommand')
    // const delta = Number(core.getInput('delta'))
    // const githubClient = github.getOctokit(githubToken)
    const prNumber = github.context.issue.number
    // const branchNameBase = github.context.payload.pull_request?.base.ref
    // const branchNameHead = github.context.payload.pull_request?.head.ref
    // execSync(commandToRun)

    const token = core.getInput('github-token')
    const githubClient = github.getOctokit(token)

    let workingDirectory = core.getInput('working-directory', {required: false})
    let cwd = workingDirectory ? resolve(workingDirectory) : 'src/react'
    // : process.cwd()
    // const cwd = process.env.BRANCH
    // console.log vs console.debug
    console.debug(cwd, 'working-directory ...')

    const CWD = cwd + sep

    // bcoz lcov file parse and tabulating is failing ..
    const lcovFiles = core
      .getInput('reports-array')
      .split(' ')
      .filter(x => x !== '')

    // we shud not need to get from user
    const baseFiles = core
      .getInput('base-reports-array')
      .split(' ')
      .filter(x => x !== '')

    console.debug(lcovFiles, baseFiles, 'coverage summary files')
    // let reports: string[] = core.getInput("reports-array")

    // reports = ["jest.common.json", "jest.web.json", "jest.pixel.json"]

    // console.debug(reports, "reports ...")
    for (let i in [lcovFiles[0]]) {
      const lcovFile = lcovFiles[i]
      const baseFile = baseFiles[i]
      console.debug(lcovFile, 'lcovFile ...only testing obt-common')
      console.debug(baseFile, 'baseFile ...')

      const file0 = join(CWD, lcovFile)
      const file1 = join(CWD, baseFile)
      console.log(file0, 'file0')

      const codeCoverageNew = <CoverageReport>(
        JSON.parse(fs.readFileSync(file1).toString())
      )
      // execSync('/usr/bin/git fetch')
      // execSync('/usr/bin/git stash')
      // execSync(`/usr/bin/git checkout --progress --force ${branchNameBase}`)
      // execSync(commandToRun)
      const codeCoverageOld = <CoverageReport>(
        JSON.parse(fs.readFileSync(file0).toString())
      )
      const currentDirectory = execSync('pwd')
        .toString()
        .trim()

      console.debug(currentDirectory, 'current dir ....')

      const diffChecker: DiffChecker = new DiffChecker(
        codeCoverageNew,
        codeCoverageOld
      )
      let messageToPost = `## Test coverage results :test_tube: \n\n`

      // diff only - true
      // true => two reports - for diff?
      // two if deletion or addition bcoz keys diff
      const coverageDetails = diffChecker.getCoverageDetails(true, `/`)

      if (coverageDetails.length === 0) {
        messageToPost =
          'No changes to code coverage between the base branch and the head branch'
      } else {
        messageToPost +=
          'Status | File | % Stmts | % Branch | % Funcs | % Lines \n -----|-----|---------|----------|---------|------ \n'
        messageToPost += coverageDetails.join('\n')
      }
      await githubClient.issues.createComment({
        repo: repoName,
        owner: repoOwner,
        body: messageToPost,
        issue_number: prNumber
      })

      // diffChecker.checkIfTestCoverageFallsBelowDelta(delta)
      // check if the test coverage is falling below delta/tolerance.
      // if () {
      // messageToPost = `Current PR reduces the test coverage percentage for some tests`
      // await githubClient.issues.createComment({
      //   repo: repoName,
      //   owner: repoOwner,
      //   body: messageToPost,
      //   issue_number: prNumber
      // })
      // throw Error(messageToPost)
      // }
    }
  } catch (error) {
    core.setFailed(error)
  }
}

run()
