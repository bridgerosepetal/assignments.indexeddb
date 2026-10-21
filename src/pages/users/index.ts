import '@awesome.me/webawesome/dist/components/accordion/accordion.js'
import '@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js'
import '@awesome.me/webawesome/dist/components/input/input.js'
import '@awesome.me/webawesome/dist/components/button/button.js'
import '@awesome.me/webawesome/dist/components/badge/badge.js'
import '@awesome.me/webawesome/dist/components/button-group/button-group.js'
import '@awesome.me/webawesome/dist/components/spinner/spinner.js'
import markup from './index.html?raw'
import './index.scss'

type WaInputElement = HTMLElement & {
  value: string
  hint: string
  disabled: boolean
  setCustomValidity(message: string): void
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function setInputError(input: WaInputElement, message: string) {
  input.setCustomValidity(message)
  input.hint = message
}

function clearInputError(input: WaInputElement) {
  input.setCustomValidity('')
  input.hint = ''
}

function isEmailShapeValid(email: string) {
  const input = document.createElement('input')

  input.type = 'email'
  input.required = true
  input.value = email

  return input.checkValidity()
}

function getUserByEmail(db: IDBDatabase, email: string): Promise<IUser | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly')
    const store = transaction.objectStore('users')
    const emailIndex = store.index('email')
    const request = emailIndex.get(email)

    request.onsuccess = () => {
      resolve(request.result as IUser | undefined)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function validateEmail(db: IDBDatabase, input: WaInputElement, currentUserId?: number): Promise<string | null> {
  clearInputError(input)

  const email = normalizeEmail(input.value)
  input.value = email

  if (!isEmailShapeValid(email)) {
    setInputError(input, 'Введите корректный email')
    return null
  }

  const existingUser = await getUserByEmail(db, email)

  if (existingUser && existingUser.id !== currentUserId) {
    setInputError(input, 'Этот email уже используется')
    return null
  }

  return email
}

interface IUser {
  name: string
  email: string
  id: number
}

function setupDB(db: IDBDatabase) {
  const objectStore = db.createObjectStore('users', {
    keyPath: 'id',
    autoIncrement: true
  })
  objectStore.createIndex('name', 'name', { unique: false })
  objectStore.createIndex('email', 'email', { unique: true })
}

async function run() {
  await new Promise(resolve => setTimeout(resolve, 500))

  const DB_VERSION = 1
  const request = indexedDB.open('UserDatabase', DB_VERSION)
  let db: IDBDatabase

  request.onupgradeneeded = function () {
    db = request.result
    setupDB(db)
  }

  request.onsuccess = async function () {
    db = request.result

    await updateListUsers(db)

    const form = document.querySelector<HTMLFormElement>('#form-add-user')

    form?.addEventListener('submit', async event => {
      event.preventDefault()

      const nameInput = form.querySelector<WaInputElement>('wa-input[name="name"]')

      const emailInput = form.querySelector<WaInputElement>('wa-input[name="email"]')

      if (!nameInput || !emailInput) return

      const name = nameInput.value.trim()
      nameInput.value = name

      const email = await validateEmail(db, emailInput)

      if (name.length < 2 || !email) {
        form.reportValidity()
        return
      }

      try {
        await addUser(db, {
          name,
          email
        })

        form.reset()
        await updateListUsers(db)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          setInputError(emailInput, 'Этот email уже используется')
          form.reportValidity()
          return
        }

        console.error('Ошибка при добавлении пользователя:', error)
      }
    })

    const addEmailInput = form?.querySelector<WaInputElement>('wa-input[name="email"]')

    addEmailInput?.addEventListener('input', () => {
      clearInputError(addEmailInput)
    })
  }

  request.onerror = function () {
    console.error('Ошибка при открытии базы данных', request.error)
  }
}

function addUser(db: IDBDatabase, user: Omit<IUser, 'id'>): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite')
    const store = transaction.objectStore('users')
    const request = store.add(user)

    request.onsuccess = () => {
      console.log('Пользователь добавлен:', user)
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

function getAllUsers(db: IDBDatabase): Promise<IUser[]> {
  return new Promise((resolve, reject) => {
    const users: IUser[] = []
    const transaction = db.transaction(['users'], 'readonly')
    const objectStore = transaction.objectStore('users')
    const request = objectStore.openCursor()

    request.onsuccess = function () {
      const cursor = request.result

      if (!cursor) {
        resolve(users)
        return
      }

      users.push(cursor.value as IUser)
      cursor.continue()
    }

    request.onerror = function () {
      reject(request.error)
    }
  })
}

function deleteUser(db: IDBDatabase, id: number) {
  const transaction = db.transaction(['users'], 'readwrite')
  const objectStore = transaction.objectStore('users')
  const request = objectStore.delete(id)

  request.onsuccess = function () {
    console.log('Пользователь удален с ID:', id)
  }

  request.onerror = function () {
    console.error('Ошибка при удалении пользователя:', request.error)
  }
}

function updateUser(db: IDBDatabase, user: IUser): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite')
    const store = transaction.objectStore('users')
    const request = store.put(user)

    request.onsuccess = () => {
      console.log('Пользователь обновлен:', user)
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function updateListUsers(db: IDBDatabase) {
  const users = await getAllUsers(db)
  const divUsers = document.querySelector<HTMLDivElement>('[data-users-wrapper]')
  if (!divUsers) return
  divUsers.innerHTML = 'Пользователи не найдены'
  if (users.length === 0) {
    divUsers.setAttribute('disabled', '')
    return
  }
  divUsers.innerHTML = '<div class="users__accordion-wrapper" data-users-accordion-wrapper></div>'
  const accordionWrapper = divUsers.querySelector<HTMLDivElement>('[data-users-accordion-wrapper]')
  if (!accordionWrapper) return
  accordionWrapper.innerHTML = `
			<wa-accordion class="users__accordion">
				${users
          .map(
            user =>
              `<wa-accordion-item data-list-users-user>
						<div slot="label" class="wa-split">
				<span data-user-label-name>${user.name}</span>

				<wa-badge
					appearance="filled-outlined"
					pill
					variant="neutral"
					style="font-size: var(--wa-font-size-xs);"
				>
					<wa-icon slot="start" name="envelope"></wa-icon>
					<span data-user-label-email>${user.email}</span>
				</wa-badge>
			</div>
			<form id="form-user-${user.id}">
				<div class="flex flex-col gap-1">
					<div class="flex flex-col gap-[4px]">
						<wa-input class="users__update-input" name="name" required minlength="2" disabled value="${user.name}"></wa-input>
						<wa-input class="users__update-input" name="email" type="email" required disabled value="${user.email}"></wa-input>
					</div>
				</div>
				<div class="mt-2 flex justify-between">
					<wa-button-group>
						<wa-button data-list-users-edit="${user.id}" type="button" autocomplete="off">Изменить</wa-button>
						<wa-button data-list-users-save="${user.id}" type="button" autocomplete="off" disabled>Сохранить</wa-button>
					</wa-button-group>
					<wa-button type="button" data-list-users-delete="${user.id}" variant="danger">Удалить</wa-button>
				</div>
			</form>
		</wa-accordion-item>
	`
          )
          .join('')}
</wa-accordion>`
  await new Promise(resolve => setTimeout(resolve, 20))
  divUsers.removeAttribute('disabled')

  const buttonsDelete = document.querySelectorAll<HTMLButtonElement>('wa-button[data-list-users-delete]')
  buttonsDelete.forEach(button => {
    button.removeEventListener('click', () => {})
  })
  buttonsDelete.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault()
      const userId = Number(button.getAttribute('data-list-users-delete'))
      deleteUser(db, userId)
      updateListUsers(db)
    })
  })
  const buttonsEdit = document.querySelectorAll<HTMLButtonElement>('wa-button[data-list-users-edit]')
  buttonsEdit.forEach(button => {
    button.removeEventListener('click', () => {})
  })
  buttonsEdit.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault()
      console.log('fsdafsd')
      const userForm = button.closest('[data-list-users-user]')?.querySelector('form')
      const nameInput = userForm?.querySelector<HTMLInputElement>('wa-input[name="name"]')
      if (nameInput) {
        nameInput.disabled = false
        console.log('I exist!')
      } else {
        return
      }
      const emailInput = userForm?.querySelector<HTMLInputElement>('wa-input[name="email"]')
      if (emailInput) {
        emailInput.disabled = false
      } else {
        return
      }
      button.disabled = true
      const buttonSave = button
        .closest<HTMLElement>('[data-list-users-user]')
        ?.querySelector<HTMLButtonElement>('[data-list-users-save]')
      if (!buttonSave) return
      buttonSave.disabled = false
    })
  })
  const buttonsSave = document.querySelectorAll<HTMLButtonElement>('wa-button[data-list-users-save]')
  buttonsSave.forEach(button => {
    button.removeEventListener('click', () => {})
  })
  buttonsSave.forEach(button => {
    button.addEventListener('click', async event => {
      event.preventDefault()

      const userItem = button.closest<HTMLElement>('[data-list-users-user]')

      const userForm = userItem?.querySelector<HTMLFormElement>('form')

      const nameInput = userItem?.querySelector<WaInputElement>('wa-input[name="name"]')

      const emailInput = userItem?.querySelector<WaInputElement>('wa-input[name="email"]')

      const nameLabel = userItem?.querySelector<HTMLElement>('[data-user-label-name]')

      const emailLabel = userItem?.querySelector<HTMLElement>('[data-user-label-email]')

      const editButton = userItem?.querySelector<HTMLButtonElement>('[data-list-users-edit]')

      if (!userForm || !nameInput || !emailInput || !nameLabel || !emailLabel || !editButton) {
        return
      }

      const userId = Number(userForm.id.slice(10))
      const name = nameInput.value.trim()
      nameInput.value = name

      const email = await validateEmail(db, emailInput, userId)

      if (name.length < 2 || !email) {
        userForm.reportValidity()
        return
      }

      const userUpdated: IUser = {
        id: userId,
        name,
        email
      }

      try {
        await updateUser(db, userUpdated)

        nameLabel.textContent = userUpdated.name
        emailLabel.textContent = userUpdated.email

        nameInput.disabled = true
        emailInput.disabled = true
        button.disabled = true
        editButton.disabled = false
      } catch (error) {
        if (error instanceof DOMException && error.name === 'ConstraintError') {
          setInputError(emailInput, 'Этот email уже используется')
          userForm.reportValidity()
          return
        }

        console.error('Ошибка при обновлении пользователя:', error)
      }
    })
  })

  const updateEmailInputs = divUsers.querySelectorAll<WaInputElement>('wa-input[name="email"]')

  updateEmailInputs.forEach(input => {
    input.addEventListener('input', () => {
      clearInputError(input)
    })
  })
}

export function renderUsersPage(root: HTMLDivElement) {
  root.innerHTML = markup
  run()
}
