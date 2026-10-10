// Guest (no account) session, for emergencies. Lives in sessionStorage on purpose:
// it ends with the tab and never leaves a guest "logged in" on a shared phone.

const FLAG = 'alavia.guest'
const TOKEN = 'alavia.guestToken'

export const guestSession = {
  isActive: () => sessionStorage.getItem(FLAG) === '1',
  enter() {
    sessionStorage.setItem(FLAG, '1')
    sessionStorage.removeItem(TOKEN)
  },
  exit() {
    sessionStorage.removeItem(FLAG)
    sessionStorage.removeItem(TOKEN)
  },
  getToken: () => sessionStorage.getItem(TOKEN),
  setToken: (token: string) => sessionStorage.setItem(TOKEN, token),
}
