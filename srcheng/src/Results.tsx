import React from 'react';
import { CircularProgress, Grid, Card, CardContent, Typography, Chip, Box } from '@mui/material';
import './Results.css';

interface Result {
  url: string;
  tags: string[];
}

interface ResultsProps {
  isLoading: boolean;
  results: Result[];
  className?: string;
}

const Results: React.FC<ResultsProps> = ({ isLoading, results, className }) => (
  <div>
    <Grid container direction="column" alignItems="center" justifyContent="center">
      {isLoading ? (
        <CircularProgress />
      ) : (
        <div className="Results">
          {results.map((result, index) => (
            <Card key={index} sx={{ marginBottom: '5px', width: '100vh', height: '11vh' }}>
              <Box display="flex" alignItems="center" height="100%">
                <CardContent>
                  <Typography variant="h5" component="h2">
                    <a href={result.url}>{result.url}</a>
                  </Typography>
                  <Box sx={{marginTop: '3px'}}>
                    {result.tags.map((tag, index) => {
                      return (
                      <Chip label={tag} key={index} style={{ margin: '5px' }} size='small' />
                    )})}
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
        </div>
      )}
    </Grid>
  </div>
);

export default Results;

export type {
  Result,
};