/*
 * Copyright (C) 2018 Matus Zamborsky
 * This file is part of The Ontology Wallet&ID.
 *
 * The The Ontology Wallet&ID is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Ontology Wallet&ID is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with The Ontology Wallet&ID.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Account, CONST, Crypto, Identity, OntidContract, TransactionBuilder, utils, Wallet, WebsocketClient } from 'ont-sdk-ts';
import { v4 as uuid } from 'uuid';
import PrivateKey = Crypto.PrivateKey;
import { storageClear, storageGet, storageSet } from './storageApi';

export async function clear() {
  await storageClear('wallet');
}

export function decryptWallet(wallet: Wallet, password: string) {
  const account = wallet.accounts[0];
  const saltHex = Buffer.from(account.salt, 'base64').toString('hex');
  const encryptedKey = account.encryptedKey;
  const scrypt = wallet.scrypt;

  return encryptedKey.decrypt(password, account.address, saltHex, {
    blockSize: scrypt.r,
    cost: scrypt.n,
    parallel: scrypt.p,
    size: scrypt.dkLen
  });
}

export async function signIn(password: string) {
  const walletEncoded = await storageGet('wallet');

  if (walletEncoded === null) {
    throw new Error('Wallet data not found.');
  }

  try {
    const wallet = Wallet.parseJson(walletEncoded);
    decryptWallet(wallet, password);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
    throw new Error('Error during wallet decryption.');
  }

  return walletEncoded;
}

export async function signUp(nodeAddress: string, password: string) {
  const mnemonics = utils.generateMnemonic();
  return await importMnemonics(nodeAddress, mnemonics, password, true);
}

export async function importMnemonics(nodeAddress: string, mnemonics: string, password: string, register: boolean) {
  const privateKey = PrivateKey.generateFromMnemonic(mnemonics);
  const wif = privateKey.serializeWIF();

  const result = await importPrivateKey(nodeAddress, wif, password, register);

  return {
    mnemonics,
    ...result
  };
}

export async function importPrivateKey(nodeAddress: string, wif: string, password: string, register: boolean) {
  const wallet = Wallet.create(uuid());
  const scrypt = wallet.scrypt;
  const scryptParams = {
    blockSize: scrypt.r,
    cost: scrypt.n,
    parallel: scrypt.p,
    size: scrypt.dkLen
  };

  const privateKey = PrivateKey.deserializeWIF(wif);
  const publicKey = privateKey.getPublicKey();


  const identity = Identity.create(privateKey, password, uuid(), scryptParams);
  const ontId = identity.ontid;

  // register the ONT ID on blockchain
  if (register) {
    const tx = OntidContract.buildRegisterOntidTx(ontId, publicKey, '0', '30000');
    tx.payer = identity.controls[0].address;
    TransactionBuilder.signTransaction(tx, privateKey);

    const client = new WebsocketClient(`ws://${nodeAddress}:${CONST.HTTP_WS_PORT}`);
    await client.sendRawTransaction(tx.serialize(), false, true);
  }

  const account = Account.create(privateKey, password, uuid(), scryptParams);

  wallet.addIdentity(identity);
  wallet.addAccount(account);
  wallet.setDefaultIdentity(identity.ontid);
  wallet.setDefaultAccount(account.address.toBase58());

  await storageSet('wallet', wallet.toJson());

  return {
    encryptedWif: account.encryptedKey.serializeWIF(),
    wallet: wallet.toJson(),
    wif
  };
}

export async function hasStoredWallet() {
  const walletEncoded = await storageGet('wallet');

  return walletEncoded != null;
}

export function getWallet(walletEncoded: any) {
  if (walletEncoded == null) {
    throw new Error('Missing wallet data.');
  }
  return Wallet.parseJsonObj(walletEncoded);
}

export function getAddress(walletEncoded: any) {
  const wallet = getWallet(walletEncoded);
  return wallet.defaultAccountAddress;
}