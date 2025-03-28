import React from 'react'
import { Link } from 'react-router-dom'

function index(props) {
  const { title } = props
  return (
    <footer>
      <div className='footer-content flex aic'>
        <Link to="/" className='reset-link flex aic jcc'>
          {title}
        </Link>
      </div>
      <div className='footer-content footer-info flex aic'>
        <div className='flex rowTitle'>© 2025 WHL. All rights reserved.</div>
      </div>
    </footer>

  )
}

export default index