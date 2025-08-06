import React from 'react';
import './App.css';

const features = [
  {
    title: 'Power Plant Map',
    description: 'Interactive map of global power plants.'
  },
  {
    title: 'Top 25 Countries',
    description: 'Countries with the highest generating capacity.'
  },
  {
    title: 'Generation Trends',
    description: 'Electricity generation over time.'
  },
  {
    title: 'Primary Fuel Mix',
    description: 'Share of capacity by primary fuel.'
  },
  {
    title: 'Data Updates',
    description: 'Modify capacity or generation values.'
  }
];

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Global Energy Dashboard</h1>
        <p className="tagline">Insights into worldwide power generation</p>
      </header>
      <main className="content">
        <section className="features">
          {features.map((f) => (
            <div className="card" key={f.title}>
              <h2>{f.title}</h2>
              <p>{f.description}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Global Energy Dashboard</p>
      </footer>
    </div>
  );
}

export default App;