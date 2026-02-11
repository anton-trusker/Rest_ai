/**
 * Syrve API Client
 * 
 * Purpose: Handle all Syrve API interactions for inventory management
 * - XML parsing and generation
 * - Authentication
 * - Stock fetching
 * - Document submission
 */

export interface SyrveConnection {
    api_url: string
    api_token: string
    store_id?: string
}

export interface SyrveProduct {
    id: string
    code: string
    name: string
}

export interface SyrveExpectedStockItem {
    product: SyrveProduct
    expectedAmount: number
    expectedSum: number
    actualAmount?: number
    differenceAmount?: number
    differenceSum?: number
}

export interface SyrveInventoryValidationResult {
    valid: boolean
    warning: boolean
    documentNumber: string
    otherSuggestedNumber?: string
    errorMessage?: string
    store?: {
        id: string
        code: string
        name: string
    }
    date?: string
    items: SyrveExpectedStockItem[]
}

export interface SyrveInventoryItem {
    productId: string
    amountContainer: number
    comment?: string
}

export class SyrveClient {
    private connection: SyrveConnection

    constructor(connection: SyrveConnection) {
        this.connection = connection
    }

    /**
     * Fetch expected stock levels from Syrve
     * Uses /documents/check/incomingInventory endpoint
     */
    async fetchExpectedStock(
        storeId: string,
        items: SyrveInventoryItem[] = []
    ): Promise<SyrveInventoryValidationResult> {
        const xml = this.buildInventoryCheckXml(storeId, items)

        const response = await fetch(
            `${this.connection.api_url}/documents/check/incomingInventory?key=${this.connection.api_token}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml',
                },
                body: xml,
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Syrve API error: ${response.status} - ${errorText}`)
        }

        const responseXml = await response.text()
        return this.parseInventoryValidationResult(responseXml)
    }

    /**
     * Submit final inventory counts to Syrve
     * Uses /documents/import/incomingInventory endpoint
     */
    async submitInventory(
        documentNumber: string,
        storeId: string,
        items: SyrveInventoryItem[]
    ): Promise<SyrveInventoryValidationResult> {
        const xml = this.buildInventoryImportXml(documentNumber, storeId, items)

        const response = await fetch(
            `${this.connection.api_url}/documents/import/incomingInventory?key=${this.connection.api_token}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml',
                },
                body: xml,
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Syrve API error: ${response.status} - ${errorText}`)
        }

        const responseXml = await response.text()
        return this.parseInventoryValidationResult(responseXml)
    }

    /**
     * Build XML for inventory check request
     */
    private buildInventoryCheckXml(
        storeId: string,
        items: SyrveInventoryItem[]
    ): string {
        const itemsXml = items.map(item => `
    <item>
      <productId>${item.productId}</productId>
      <amountContainer>${item.amountContainer}</amountContainer>
      ${item.comment ? `<comment>${this.escapeXml(item.comment)}</comment>` : ''}
    </item>`).join('')

        return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>CHECK-${Date.now()}</documentNumber>
  <dateIncoming>${new Date().toISOString().split('.')[0]}</dateIncoming>
  <status>NEW</status>
  <storeId>${storeId}</storeId>
  <items>${itemsXml}
  </items>
</document>`
    }

    /**
     * Build XML for inventory import (final submission)
     */
    private buildInventoryImportXml(
        documentNumber: string,
        storeId: string,
        items: SyrveInventoryItem[]
    ): string {
        const itemsXml = items.map(item => `
    <item>
      <productId>${item.productId}</productId>
      <amountContainer>${item.amountContainer}</amountContainer>
      ${item.comment ? `<comment>${this.escapeXml(item.comment)}</comment>` : ''}
    </item>`).join('')

        return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>${documentNumber}</documentNumber>
  <dateIncoming>${new Date().toISOString().split('.')[0]}</dateIncoming>
  <status>PROCESSED</status>
  <storeId>${storeId}</storeId>
  <comment>Inventory submission from Inventory AI</comment>
  <items>${itemsXml}
  </items>
</document>`
    }

    /**
     * Parse Syrve XML response
     * Note: This is a simplified parser. In production, use a proper XML parser library
     */
    private parseInventoryValidationResult(xml: string): SyrveInventoryValidationResult {
        // Extract basic fields
        const valid = this.extractXmlValue(xml, 'valid') === 'true'
        const warning = this.extractXmlValue(xml, 'warning') === 'true'
        const documentNumber = this.extractXmlValue(xml, 'documentNumber') || ''
        const errorMessage = this.extractXmlValue(xml, 'errorMessage')

        // Extract store info
        const storeId = this.extractXmlValue(xml, 'store/id')
        const storeCode = this.extractXmlValue(xml, 'store/code')
        const storeName = this.extractXmlValue(xml, 'store/name')

        const store = storeId ? {
            id: storeId,
            code: storeCode || '',
            name: storeName || '',
        } : undefined

        // Extract items (simplified - would need proper XML parsing in production)
        const items: SyrveExpectedStockItem[] = []
        const itemMatches = xml.matchAll(/<item>(.*?)<\/item>/gs)

        for (const match of itemMatches) {
            const itemXml = match[1]

            const productId = this.extractXmlValue(itemXml, 'product/id') || ''
            const productCode = this.extractXmlValue(itemXml, 'product/code') || ''
            const productName = this.extractXmlValue(itemXml, 'product/name') || ''

            const expectedAmount = parseFloat(this.extractXmlValue(itemXml, 'expectedAmount') || '0')
            const expectedSum = parseFloat(this.extractXmlValue(itemXml, 'expectedSum') || '0')
            const actualAmount = parseFloat(this.extractXmlValue(itemXml, 'actualAmount') || '0')
            const differenceAmount = parseFloat(this.extractXmlValue(itemXml, 'differenceAmount') || '0')
            const differenceSum = parseFloat(this.extractXmlValue(itemXml, 'differenceSum') || '0')

            items.push({
                product: {
                    id: productId,
                    code: productCode,
                    name: productName,
                },
                expectedAmount,
                expectedSum,
                actualAmount,
                differenceAmount,
                differenceSum,
            })
        }

        return {
            valid,
            warning,
            documentNumber,
            errorMessage,
            store,
            items,
        }
    }

    /**
     * Extract value from XML (simplified - not production-ready)
     */
    private extractXmlValue(xml: string, path: string): string | undefined {
        const tags = path.split('/')
        let current = xml

        for (const tag of tags) {
            const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's')
            const match = current.match(regex)
            if (!match) return undefined
            current = match[1]
        }

        return current.trim()
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
    }
}

/**
 * Factory function to create Syrve client from database connection
 */
export async function createSyrveClient(supabase: any): Promise<SyrveClient> {
    const { data: connection, error } = await supabase
        .from('syrve_connections')
        .select('*')
        .eq('is_active', true)
        .single()

    if (error || !connection) {
        throw new Error('No active Syrve connection found')
    }

    return new SyrveClient({
        api_url: connection.api_url,
        api_token: connection.api_token,
        store_id: connection.store_id,
    })
}
