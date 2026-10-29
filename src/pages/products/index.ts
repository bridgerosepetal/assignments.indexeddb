// #region Imports
import markup from './index.html?raw'
import './index.scss'
import '@awesome.me/webawesome/dist/components/spinner/spinner.js'
import WaInput from '@awesome.me/webawesome/dist/components/input/input.js'
import WaButton from '@awesome.me/webawesome/dist/components/button/button.js'
import Dexie from 'dexie'
import { escapeHtml } from '../../shared/escapeHtml'
// #endregion

// #region Constants
const DATABASE_NAME = 'ProductDatabase'
// #endregion

// #region Functions
function openDatabase(): Dexie {
  const db = new Dexie(DATABASE_NAME)
  db.version(1).stores({
    products: '++id,category,price,title'
  })
  return db
}

async function alreadyHasData(db: Dexie): Promise<boolean> {
  const count: number =
    (await db.tables
      .find(table => {
        return table.name === 'products'
      })
      ?.count()) ?? 0
  if (count > 0) {
    return true
  } else {
    return false
  }
}

async function syncFromAPI(db: Dexie) {
  ;(window as any).mydata = { new: 0, changed: 0 }
  try {
    const response = await fetch('https://fakestoreapi.com/products')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    const products = data

    const productsForDB = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      category: product.category,
      price: product.price
    }))
    const productsTable = db.table('products')
    const oldProducts = await productsTable.toArray()
    function getChangedIds(oldProducts: any[], newProducts: any[]): number[] {
      return newProducts
        .filter(newProduct => {
          const oldProduct = oldProducts.find(old => old.id === newProduct.id)
          return (
            !oldProduct ||
            oldProduct.title !== newProduct.title ||
            oldProduct.category !== newProduct.category ||
            oldProduct.price !== newProduct.price
          )
        })
        .map(product => product.id)
    }

    const changedIds = getChangedIds(oldProducts, productsForDB)
    const newProducts = productsForDB.filter((product: any) => !oldProducts.some(old => old.id === product.id))
    ;(window as any).mydata = {
      new: newProducts.length,
      changed: changedIds.length - newProducts.length
    }
    const removedIds = oldProducts
      .filter(old => !productsForDB.some((product: any) => product.id === old.id))
      .map(old => old.id)

    await db.transaction('rw', productsTable, async () => {
      await productsTable.bulkDelete(removedIds)
      await productsTable.bulkPut(productsForDB.filter((product: any) => changedIds.includes(product.id)))
    })
    window.alert(`Новых: ${(window as any).mydata.new}, изменено: ${(window as any).mydata.changed}`)
    return products
  } catch (error) {
    console.error('Синхронизация с Fake Store API не вышла', error)
    const message = navigator.onLine
      ? 'Не удалось загрузить товары, ошибка API. Попробуйте позже.'
      : 'Нет сети. Не удалось загрузить товары.'
    const root = document.querySelector('[data-root]')
    if (root && !root.querySelector('.table')) {
      root.innerHTML = `<div class="spinny">${message}</div>`
    } else {
      window.alert(message)
    }
    return null
  }
}

function renderTable(products: any[]) {
  const root = document.querySelector('[data-root]')

  if (!root) return

  root.innerHTML = `
		<table class="table">
			<thead>
				<tr>
					<th>Title</th>
					<th>Category</th>
					<th>
						<wa-button data-price-button>
							Price
						</wa-button>
					</th>
				</tr>
			</thead>
			<tbody>
				${products
          .map(
            product => `
					<tr>
						<td>${escapeHtml(product.title)}</td>
						<td>
							<wa-button data-category-button="${escapeHtml(product.category)}">${escapeHtml(product.category)}</wa-button>
						</td>
						<td>$${product.price}</td>
					</tr>
				`
          )
          .join('')}
			</tbody>
		</table>
	`
}

function hideSpinny() {
  const spinny = document.querySelector('[data-sync-spinny]')
  spinny?.remove()
}

let query = ''
let category = ''
let priceSort = ''

async function showProducts(db: Dexie) {
  let products = await db.table('products').toArray()

  if (category) {
    products = products.filter(product => product.category === category)
  }
  if (query) {
    products = products.filter(product => product.title.toLowerCase().includes(query))
  }
  if (priceSort === 'asc') {
    products.sort((a, b) => a.price - b.price)
  }
  if (priceSort === 'desc') {
    products.sort((a, b) => b.price - a.price)
  }

  renderTable(products)
}

function handleRefreshButtonClick(element: Element | null, db: Dexie) {
  if (element === null) return
  element.addEventListener('click', async () => {
    const products = await syncFromAPI(db)
    if (products) {
      await showProducts(db)
      window.alert('Успешно обновлено!')
    }
  })
}

/**
 * The main function
 */
async function run() {
  const db = openDatabase()

  if (await alreadyHasData(db)) {
    await showProducts(db)
  }

  const refreshButton = document.querySelector('[data-button-refresh]')

  handleRefreshButtonClick(refreshButton, db)

  document.querySelector<WaInput>('[data-name-search]')?.addEventListener('input', async event => {
    if (event.target instanceof WaInput) {
      query = event.target.value?.trim().toLowerCase() ?? ''
      await showProducts(db)
    }
  })
  document.querySelector('[data-root]')?.addEventListener('click', async event => {
    const button = (event.target as Element).closest<WaButton>('[data-category-button]')

    if (!button) return

    category = button.dataset.categoryButton ?? ''
    await showProducts(db)
  })
  document.querySelector('[data-root]')?.addEventListener('click', async event => {
    const button = (event.target as Element).closest<WaButton>('[data-price-button]')
    if (!button) return

    priceSort = priceSort === 'asc' ? 'desc' : 'asc'
    await showProducts(db)
  })
  document.querySelector('[data-button-reset]')?.addEventListener('click', async () => {
    query = ''
    category = ''
    priceSort = ''
    const searchInput = document.querySelector<WaInput>('[data-name-search]')
    if (searchInput) searchInput.value = ''
    await showProducts(db)
  })
  hideSpinny()
  const products = await syncFromAPI(db)
  if (products) {
    await showProducts(db)
  }
}
// #endregion

// #region Exports
export function renderProductsPage(root: HTMLDivElement) {
  root.innerHTML = markup
  run()
}
// #endregion
