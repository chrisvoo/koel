import {reactive} from 'vue'
import {http} from '@/services'

export const systemStore = {
  state: reactive({
    totalSongs: 0,
    totalBytes: 0
  }),

  async init () {
    await this.refresh()
  },

  async getInfo(): Promise<{total_songs: number, total_size: number}> {
    return await http.get<{
      total_size: number,
      total_songs: number
    }>('system');
  },

  async refresh () {
    const resource = await this.getInfo();
    this.state.totalBytes = resource.total_size;
    this.state.totalSongs = resource.total_songs;
  }
}
