import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './Theme';
import SearchBar from './SearchBar';
import Results from './Results';
import { Result } from './Results';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const handleSearch = async () => {
    setIsLoading(true);

    // call cluster
    let url = 'localhost:3300/mr/query';
    let req = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: searchTerm,
    };

    let res = await fetch(url, req);
    let data = res.json();
    let results = data['response'];

    setResults(results);

    setIsLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <SearchBar 
          className="SearchBar"
          searchTerm={searchTerm} 
          onSearchTermChange={setSearchTerm} 
          onSearch={handleSearch} 
        />
        <Results 
          className="Results"
          isLoading={isLoading} 
          results={results} 
        />
      </div>
    </ThemeProvider>
  );
}

export default App;