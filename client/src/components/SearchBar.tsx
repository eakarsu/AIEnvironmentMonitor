import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSearch} role="search">
      <input
        type="search"
        className="search-input"
        placeholder="Search all data..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search all environmental data"
      />
      <button type="submit" className="search-btn" aria-label="Submit search">
        🔍
      </button>
    </form>
  );
};

export default SearchBar;
