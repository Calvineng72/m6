import React from 'react';
import { TextField, Button, Grid, Typography } from '@mui/material';

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (newTerm: string) => void;
  onSearch: () => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchTermChange, onSearch, className }) => {
  return (
    <Grid container direction="column" alignItems="center" justifyContent="center" sx={{marginTop: '10vh', marginBottom: '5vh'}}>
      <Typography variant="h2" component="h1" gutterBottom color='white'>
        Search Engine
      </Typography>
      <Grid item container direction="column" alignItems="center" justifyContent="center" sx={{ width: '70%' }}>
        <TextField 
          value={searchTerm} 
          onChange={e => onSearchTermChange(e.target.value)} 
          placeholder="Search..." 
          fullWidth={true}
          sx={{ backgroundColor: 'white', borderRadius: '5px' }}
        />
        <Button variant="contained" color="primary" onClick={onSearch} sx={{ marginTop: 2 }}>
          Search
        </Button>
      </Grid>
    </Grid>
  );
};

export default SearchBar;