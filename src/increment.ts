import { Neovim } from '@chemzqm/neovim'
import workspace from './workspace'
import Emitter = require('events')
const logger = require('./util/logger')('increment')

export interface LastInsert {
  character: string
  timestamp: number
}

export default class Increment extends Emitter {
  public lastInsert?: LastInsert
  private activted = false

  constructor(private nvim: Neovim) {
    super()
  }

  public get latestInsert(): LastInsert | null {
    let { lastInsert } = this
    let d = workspace.isVim ? 100 : 50
    if (!lastInsert || Date.now() - lastInsert.timestamp > d) {
      return null
    }
    return lastInsert
  }

  public get latestInsertChar(): string {
    let { latestInsert } = this
    if (!latestInsert) return ''
    return latestInsert.character
  }

  /**
   * start
   *
   * @public
   * @param {string} input - current user input
   * @param {string} word - the word before cursor
   * @returns {Promise<void>}
   */
  public start(): void {
    let { nvim, activted } = this
    if (activted) return
    this.activted = true
    let opt = Increment.getStartOption()
    nvim.command(`noa set completeopt=${opt}`, true)
    this.emit('start')
  }

  public stop(): void {
    let { nvim, activted } = this
    if (!activted) return
    this.activted = false
    let completeOpt = workspace.completeOpt
    nvim.command(`noa set completeopt=${completeOpt}`, true)
    this.emit('stop')
  }

  public get isActivted(): boolean {
    return this.activted
  }

  // keep other options
  public static getStartOption(): string {
    let opt = workspace.completeOpt
    let useNoSelect = workspace.getConfiguration('coc.preferences').get('noselect', 'true')
    let parts = opt.split(',')
    // longest & menu can't work with increment search
    parts = parts.filter(s => s != 'menu' && s != 'longest')
    if (parts.indexOf('menuone') === -1) {
      parts.push('menuone')
    }
    if (parts.indexOf('noinsert') === -1) {
      parts.push('noinsert')
    }
    if (useNoSelect && parts.indexOf('noselect') === -1) {
      parts.push('noselect')
    }
    return parts.join(',')
  }
}
