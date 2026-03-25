require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('Clearing old incomplete products...');
    // We have to disable foreign key checks temporarily if order_items depend on products
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Products table cleared!');

    const cars = [
      { name: "Twin Mill", price: 299, image: "/images/1.jpeg", desc: "The iconic Twin Mill with dual engines and aggressive styling. A Hot Wheels legend since 1969." },
      { name: "Bone Shaker", price: 349, image: "/images/2.jpeg", desc: "A hot rod with a skull grille that screams attitude. One of the most popular fantasy castings." },
      { name: "Deora II", price: 399, image: "/images/3.jpeg", desc: "A futuristic surf wagon concept. Sleek, stylish, and absolutely radical." },
      { name: "Rodger Dodger", price: 279, image: "/images/4.jpeg", desc: "Classic muscle car vibes with a massive engine scoop. Pure American power." },
      { name: "Nissan GT-R R35", price: 449, image: "/images/5.jpeg", desc: "Godzilla in die-cast form. Japanese engineering meets Hot Wheels precision." },
      { name: "Tesla Roadster", price: 499, image: "/images/6.jpeg", desc: "The electric future in miniature. Sleek design, zero emissions, maximum cool." },
      { name: "Lamborghini Veneno", price: 549, image: "/images/7.jpeg", desc: "Italian supercar perfection. Sharp angles and blistering speed in 1:64 scale." },
      { name: "Ford Mustang GT", price: 329, image: "/images/8.jpeg", desc: "America's pony car in Hot Wheels form. Classic style with modern muscle." },
      { name: "Porsche 911 GT3", price: 479, image: "/images/9.jpeg", desc: "German precision engineering. Track-ready performance in your palm." },
      { name: "BMW M3 GTR", price: 429, image: "/images/10.jpeg", desc: "The legendary Need for Speed icon. Racing heritage meets collector appeal." }
    ];

    console.log('Seeding all 10 correct cars...');
    for (const car of cars) {
      await connection.query(
        'INSERT INTO products (name, price, image_url, description) VALUES (?, ?, ?, ?)',
        [car.name, car.price, car.image, car.desc]
      );
    }
    
    console.log('Done! All 10 cars inserted into Railway live database.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixDatabase();
