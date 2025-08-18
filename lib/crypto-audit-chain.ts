import crypto from "crypto"

export interface AuditBlock {
  id: string
  timestamp: number
  agentId: string
  interactionType: "test" | "query" | "response" | "evaluation"
  data: any
  hash: string
  previousHash: string
  signature: string
  merkleRoot: string
}

export interface InteractionLog {
  id: string
  agentId: string
  prompt: string
  response: string
  responseTime: number
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  quality: {
    relevance: number
    accuracy: number
    safety: number
    overall: number
  }
  metadata: {
    model: string
    temperature: number
    maxTokens: number
    provider: string
  }
}

export class CryptoAuditChain {
  private static instance: CryptoAuditChain
  private chain: AuditBlock[] = []
  private privateKey: string
  private publicKey: string

  constructor() {
    // Generate RSA key pair for digital signatures
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    })

    this.privateKey = privateKey
    this.publicKey = publicKey

    // Create genesis block
    this.createGenesisBlock()
  }

  static getInstance(): CryptoAuditChain {
    if (!CryptoAuditChain.instance) {
      CryptoAuditChain.instance = new CryptoAuditChain()
    }
    return CryptoAuditChain.instance
  }

  private createGenesisBlock(): void {
    const genesisData = {
      message: "AI Governance Chain Genesis Block",
      timestamp: Date.now(),
      version: "1.0.0",
    }

    const genesisBlock: AuditBlock = {
      id: "0",
      timestamp: Date.now(),
      agentId: "system",
      interactionType: "test",
      data: genesisData,
      hash: this.calculateHash("0", Date.now(), "system", genesisData, "0"),
      previousHash: "0",
      signature: "",
      merkleRoot: this.calculateMerkleRoot([genesisData]),
    }

    genesisBlock.signature = this.signBlock(genesisBlock)
    this.chain.push(genesisBlock)
  }

  private calculateHash(id: string, timestamp: number, agentId: string, data: any, previousHash: string): string {
    const blockString = JSON.stringify({ id, timestamp, agentId, data, previousHash })
    return crypto.createHash("sha256").update(blockString).digest("hex")
  }

  private calculateMerkleRoot(transactions: any[]): string {
    if (transactions.length === 0) return ""
    if (transactions.length === 1) {
      return crypto.createHash("sha256").update(JSON.stringify(transactions[0])).digest("hex")
    }

    const hashes = transactions.map((tx) => crypto.createHash("sha256").update(JSON.stringify(tx)).digest("hex"))

    while (hashes.length > 1) {
      const newHashes = []
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i]
        const right = hashes[i + 1] || left
        const combined = crypto
          .createHash("sha256")
          .update(left + right)
          .digest("hex")
        newHashes.push(combined)
      }
      hashes.splice(0, hashes.length, ...newHashes)
    }

    return hashes[0]
  }

  private signBlock(block: AuditBlock): string {
    const blockData = JSON.stringify({
      id: block.id,
      timestamp: block.timestamp,
      agentId: block.agentId,
      data: block.data,
      hash: block.hash,
      previousHash: block.previousHash,
    })

    const signature = crypto.sign("sha256", Buffer.from(blockData), this.privateKey)
    return signature.toString("base64")
  }

  public verifyBlock(block: AuditBlock): boolean {
    const blockData = JSON.stringify({
      id: block.id,
      timestamp: block.timestamp,
      agentId: block.agentId,
      data: block.data,
      hash: block.hash,
      previousHash: block.previousHash,
    })

    try {
      return crypto.verify("sha256", Buffer.from(blockData), this.publicKey, Buffer.from(block.signature, "base64"))
    } catch (error) {
      return false
    }
  }

  public addInteractionBlock(agentId: string, interactionType: AuditBlock["interactionType"], data: any): AuditBlock {
    const previousBlock = this.chain[this.chain.length - 1]
    const newId = this.chain.length.toString()
    const timestamp = Date.now()

    const newBlock: AuditBlock = {
      id: newId,
      timestamp,
      agentId,
      interactionType,
      data,
      hash: this.calculateHash(newId, timestamp, agentId, data, previousBlock.hash),
      previousHash: previousBlock.hash,
      signature: "",
      merkleRoot: this.calculateMerkleRoot([data]),
    }

    newBlock.signature = this.signBlock(newBlock)
    this.chain.push(newBlock)

    return newBlock
  }

  public validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]
      const previousBlock = this.chain[i - 1]

      // Verify block signature
      if (!this.verifyBlock(currentBlock)) {
        console.error(`Block ${currentBlock.id} has invalid signature`)
        return false
      }

      // Verify hash chain
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`Block ${currentBlock.id} has invalid previous hash`)
        return false
      }

      // Verify block hash
      const calculatedHash = this.calculateHash(
        currentBlock.id,
        currentBlock.timestamp,
        currentBlock.agentId,
        currentBlock.data,
        currentBlock.previousHash,
      )

      if (currentBlock.hash !== calculatedHash) {
        console.error(`Block ${currentBlock.id} has invalid hash`)
        return false
      }
    }

    return true
  }

  public getChain(): AuditBlock[] {
    return [...this.chain] // Return copy to prevent tampering
  }

  public getBlocksByAgent(agentId: string): AuditBlock[] {
    return this.chain.filter((block) => block.agentId === agentId)
  }

  public exportChainProof(): string {
    return JSON.stringify({
      chain: this.chain,
      publicKey: this.publicKey,
      chainValid: this.validateChain(),
      totalBlocks: this.chain.length,
      exportTimestamp: Date.now(),
    })
  }
}
