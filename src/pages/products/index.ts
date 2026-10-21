// #region Imports
import markup from './index.html?raw'
import './index.scss'
import '@awesome.me/webawesome/dist/components/spinner/spinner.js'
import WaInput from '@awesome.me/webawesome/dist/components/input/input.js'
import WaButton from '@awesome.me/webawesome/dist/components/button/button.js'
import Dexie from 'dexie'
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
  try {
    const response = await fetch('https://fakestoreapi.com/products')
    const data = await response.json()
    const products = data

    const productsForDB = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      category: product.category,
      price: product.price
    }))
    const productsTable = db.table('products')
    await db.transaction('rw', productsTable, async () => {
      await productsTable.clear()
      await productsTable.bulkPut(productsForDB)
    })
    return products
  } catch (error) {
    console.error('Синхронизация с Fake Store API не вышла', error)
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
						<td>${product.title}</td>
						<td>
							<wa-button data-category-button="${product.category}">${product.category}</wa-button>
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

function handleRefreshButtonClick(element: Element | null, db: Dexie) {
  if (element === null) return
  element.addEventListener('click', async () => {
    const products = await syncFromAPI(db)
    if (products) {
      renderTable(products)
      window.alert('Успешно обновлено!')
    }
  })
}

/**
 * The main function
 */
async function run() {
  await new Promise(resolve => setTimeout(resolve, 1000 - Math.random() * 1000))

  const db = openDatabase()

  if (await alreadyHasData(db)) {
    const products = await db.table('products').toArray()
    renderTable(products)
  }

  const refreshButton = document.querySelector('[data-button-refresh]')

  handleRefreshButtonClick(refreshButton, db)

  document.querySelector<WaInput>('[data-name-search]')?.addEventListener('input', async event => {
    if (event.target instanceof WaInput) {
      const query = event.target.value?.trim().toLowerCase()
      if (!query) {
        const products = await db.table('products').toArray()
        renderTable(products)
        return
      }

      const products = await db.table('products').where('title').startsWithIgnoreCase(query).toArray()

      renderTable(products)
    }
  })
  document.querySelector('[data-root]')?.addEventListener('click', async event => {
    const button = (event.target as Element).closest<WaButton>('[data-category-button]')

    if (!button) return

    const category = button.dataset.categoryButton
    const products = await db.table('products').where('category').equals(category!).toArray()

    renderTable(products)
  })
  document.querySelector('[data-root]')?.addEventListener('click', async event => {
    const button = (event.target as Element).closest<WaButton>('[data-price-button]')
    if (!button) return

    if (window.sessionStorage.getItem('priceorder') === null) {
      window.sessionStorage.setItem('priceorder', 'down')
    }

    let products = []

    if (window.sessionStorage.getItem('priceorder') === 'down') {
      products = await db.table('products').orderBy('price').toArray()
      window.sessionStorage.setItem('priceorder', 'up')
      console.log(window.sessionStorage.getItem('priceorder'))
      renderTable(products)
      return
    }

    if (window.sessionStorage.getItem('priceorder') === 'up') {
      products = (await db.table('products').orderBy('price').toArray()).reverse()
      window.sessionStorage.setItem('priceorder', 'down')
      console.log(window.sessionStorage.getItem('priceorder'))
      renderTable(products)
      return
    }
  })
  await new Promise(resolve => setTimeout(resolve, 10000 - Math.random() * 500))
  hideSpinny()
  const products = await syncFromAPI(db)
  if (products) {
    renderTable(products)
  }
}
// #endregion

// #region Exports
export function renderProductsPage(root: HTMLDivElement) {
  root.innerHTML = markup
  run()
}
// #endregion
