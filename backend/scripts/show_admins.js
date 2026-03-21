#!/usr/bin/env node
import { initDatabase, models } from '../config/database.js';

async function main(){
  await initDatabase();
  const { Admin } = models;
  if(!Admin){
    console.error('Admin model not available');
    process.exit(1);
  }
  const admins = await Admin.findAll({ limit: 20 });
  console.log('Admins:', admins.map(a => (a.toJSON ? a.toJSON() : a)));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
