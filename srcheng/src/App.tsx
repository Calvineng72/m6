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
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setResults([{
      url: 'https://www.npmjs.com/package/@material-ui/core',
      tags: ['npmjs', 'material-ui', 'core', 'React'],
    }, {
      url: 'https://www.npmjs.com/package/@mui/material',
      tags: ['npmjs', 'mui', 'material', 'React'],
    }, {
      url: 'https://www.npmjs.com/package/@material-ui/icons',
      tags: ['npmjs', 'material-ui', 'icons', 'React'],
    }, {
      url: 'https://www.npmjs.com/package/react-material-ui-form-validator',
      tags: ['npmjs', 'form', 'validator', 'material-ui'],
    }, {
      url: 'https://www.npmjs.com/package/@mui/icons-material',
      tags: ['npmjs', 'mui', 'icons', 'svg'],
    }, {
      url: 'https://www.npmjs.com/package/@material-ui/styles',
      tags: ['npmjs', 'material-ui', 'styles', 'React'],
    }]);
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