import React, { useState, useEffect } from 'react'
import { Paper, InputBase, IconButton, Autocomplete } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

function SearchBar({
  sx, placeholder, handleSummit = () => { }, defaultValue, options, onChange = () => { }, isIcon = true, value, autoFocus, onlyOptionSearch = false,
  ...props
}) {

  const [opening, setOpen] = useState(false)
  const [bselect, setSelect] = useState(false)

  useEffect(() => {
    !!defaultValue && setValue(defaultValue)
    !!defaultValue && defaultValue.length > 0 && onChange(defaultValue)
  }, [])


  const SearchClick = () => {
    handleSummit(value || "")
  }
  return (
    <Autocomplete
      value={value || ""}
      autoFocus
      onChange={(e, value) => (onChange(value || ""), handleSummit(value || ""))}
      // onInputChange={(e, value) => console.log('input change', value)}
      freeSolo
      onOpen={(e) => setOpen(true)}
      onClose={(e) => setOpen(false)}
      onHighlightChange={e => setSelect(!!e)}
      disableClearable
      // isOptionEqualToValue={(option, value) => false}
      renderInput={(params) => {
        const { InputLabelProps, InputProps, ...rest } = params;
        return (
          <Paper
            component="form"
            sx={{ p: `${!!isIcon ? 2 : 8}px 4px`, display: 'flex', alignItems: 'center', borderTop: "2px solid #1f1f1f", ...sx }}
            onSubmit={(e) => { e.preventDefault() }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              {...params.InputProps} {...rest}
              onChange={e => onChange(e.target.value || "")}
              onKeyDown={e => { if (e.keyCode == 13 && !onlyOptionSearch) { e.preventDefault(); (!opening || !bselect) && SearchClick() } }}
              placeholder={placeholder}
              autoFocus={autoFocus}
            />
            {!!isIcon &&
              <IconButton type="button" sx={{ p: '10px' }} onClick={SearchClick}>
                <SearchIcon />
              </IconButton>
            }
          </Paper>
        )
      }
      }
      options={((value?.trim() == "" ? [] : options) || []).map(m => m.text)}
      filterOptions={options => options}
      {...props}
    />
  )
}

export default SearchBar