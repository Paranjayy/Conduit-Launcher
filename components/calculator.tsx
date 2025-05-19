import React, { useState, useEffect, useRef } from 'react';
import { Calculator as CalculatorIcon, X, Copy, Globe, RefreshCw, Clock, Calendar } from 'lucide-react';

interface CalculatorProps {
  onViewChange: (view: string) => void;
}

// Exchange rates - in a real app, these would come from an API
const exchangeRates = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.34,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.42,
  CNY: 7.22,
};

type CurrencyCode = keyof typeof exchangeRates;

// Time units for conversion
const timeUnits = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000, // Approximate (30 days)
  years: 31536000, // Non-leap year
};

type TimeUnit = keyof typeof timeUnits;

export function Calculator({ onViewChange }: CalculatorProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ input: string; result: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Currency conversion state
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [showTimeCalculator, setShowTimeCalculator] = useState(false);
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('EUR');
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
  
  // Time calculation state
  const [timeCalcMode, setTimeCalcMode] = useState<'diff' | 'convert' | 'add'>('diff');
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [timeAmount, setTimeAmount] = useState('1');
  const [fromTimeUnit, setFromTimeUnit] = useState<TimeUnit>('hours');
  const [toTimeUnit, setToTimeUnit] = useState<TimeUnit>('minutes');
  const [addSubtract, setAddSubtract] = useState<'add' | 'subtract'>('add');
  const [timeResult, setTimeResult] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Simple maths calculation function
  const calculate = (expression: string): number => {
    // Check for natural language time queries like "2 hours from now" or "3 days ago"
    const timeNaturalRegex = /(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+(from\s+now|ago)/i;
    const timeNaturalMatch = expression.match(timeNaturalRegex);
    
    if (timeNaturalMatch) {
      const value = parseInt(timeNaturalMatch[1]);
      const unit = timeNaturalMatch[2].toLowerCase() as TimeUnit;
      const direction = timeNaturalMatch[3].toLowerCase();
      
      // Convert unit to seconds
      let unitInSeconds = 0;
      switch(unit) {
        case 'second': unitInSeconds = 1; break;
        case 'minute': unitInSeconds = 60; break;
        case 'hour': unitInSeconds = 3600; break;
        case 'day': unitInSeconds = 86400; break;
        case 'week': unitInSeconds = 604800; break;
        case 'month': unitInSeconds = 2592000; break; // ~30 days
        case 'year': unitInSeconds = 31536000; break; // ~365 days
        default: unitInSeconds = 1;
      }
      
      const now = new Date();
      let targetDate: Date;
      
      if (direction.includes('now')) {
        // Future time
        targetDate = new Date(now.getTime() + (value * unitInSeconds * 1000));
      } else {
        // Past time
        targetDate = new Date(now.getTime() - (value * unitInSeconds * 1000));
      }
      
      // Format the result
      const result = targetDate.toLocaleString();
      
      // Display result directly
      setResult(result);
      setError(null);
      
      // Add to history
      setHistory(prev => [
        { input: expression, result },
        ...prev.slice(0, 9)
      ]);
      
      // Return a placeholder value as we've already handled the display
      return 0;
    }
    
    // Check for timezone conversion like "10 AM PST to EST" or "3:30 PM IST in GMT"
    const timezoneRegex = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*([A-Z]{3,4})\s*(?:to|in)\s*([A-Z]{3,4})/i;
    const timezoneMatch = expression.match(timezoneRegex);
    
    if (timezoneMatch) {
      try {
        const timeStr = timezoneMatch[1].trim();
        const fromTz = timezoneMatch[2].toUpperCase();
        const toTz = timezoneMatch[3].toUpperCase();
        
        // Get mapping of timezone abbreviations to time zone names
        const tzMap: Record<string, string> = {
          'EST': 'America/New_York',
          'EDT': 'America/New_York',
          'CST': 'America/Chicago',
          'CDT': 'America/Chicago',
          'MST': 'America/Denver',
          'MDT': 'America/Denver',
          'PST': 'America/Los_Angeles',
          'PDT': 'America/Los_Angeles',
          'GMT': 'Europe/London',
          'BST': 'Europe/London',
          'UTC': 'Etc/UTC',
          'IST': 'Asia/Kolkata',
          'JST': 'Asia/Tokyo',
          'AEST': 'Australia/Sydney',
          'AEDT': 'Australia/Sydney',
          'CET': 'Europe/Paris',
          'CEST': 'Europe/Paris'
        };
        
        // Check if we support these timezones
        if (!tzMap[fromTz] || !tzMap[toTz]) {
          throw new Error(`Unsupported timezone: ${!tzMap[fromTz] ? fromTz : toTz}`);
        }
        
        // Parse the time
        let hour = 0;
        let minute = 0;
        let isPM = false;
        
        if (timeStr.toLowerCase().includes('pm')) {
          isPM = true;
        }
        
        if (timeStr.includes(':')) {
          const [hourStr, minuteStr] = timeStr.split(':');
          hour = parseInt(hourStr);
          // Handle the case of "3:30PM" (no space)
          const minuteMatch = minuteStr.match(/(\d+)/);
          if (minuteMatch) {
            minute = parseInt(minuteMatch[1]);
          }
        } else {
          // Just the hour like "3 PM"
          const hourMatch = timeStr.match(/(\d+)/);
          if (hourMatch) {
            hour = parseInt(hourMatch[1]);
          }
        }
        
        // Adjust for PM
        if (isPM && hour < 12) {
          hour += 12;
        }
        
        // Create a date with the source timezone
        const now = new Date();
        const sourceDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          hour, minute, 0
        ));
        
        // Convert from source timezone to target timezone
        const fromOffset = getTimezoneOffset(fromTz);
        const toOffset = getTimezoneOffset(toTz);
        const offsetDiff = toOffset - fromOffset;
        
        const targetDate = new Date(sourceDate.getTime() + offsetDiff * 60 * 1000);
        
        // Format the converted time
        const options: Intl.DateTimeFormatOptions = {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
          timeZone: tzMap[toTz]
        };
        
        const result = `${timeStr} ${fromTz} = ${targetDate.toLocaleTimeString('en-US', options)} ${toTz}`;
        
        // Display result directly
        setResult(result);
        setError(null);
        
        // Add to history
        setHistory(prev => [
          { input: expression, result },
          ...prev.slice(0, 9)
        ]);
        
        // Return a placeholder value as we've already handled the display
        return 0;
      } catch (err) {
        throw new Error(`Timezone conversion error: ${(err as Error).message}`);
      }
    }
    
    // Check if it's a currency conversion query using pattern: 100 USD to EUR
    const currencyRegex = /(\d+(?:\.\d+)?)\s*(USD|EUR|GBP|JPY|CAD|AUD|INR|CNY)\s*(?:to|in)\s*(USD|EUR|GBP|JPY|CAD|AUD|INR|CNY)/i;
    const match = expression.match(currencyRegex);
    
    if (match) {
      const value = parseFloat(match[1]);
      const from = match[2].toUpperCase() as CurrencyCode;
      const to = match[3].toUpperCase() as CurrencyCode;
      
      return convertCurrency(value, from, to);
    }
    
    // Check for time calculation queries like "2 hours in minutes" or "30 minutes to hours"
    const timeRegex = /(\d+(?:\.\d+)?)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s*(?:to|in)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)/i;
    const timeMatch = expression.match(timeRegex);
    
    if (timeMatch) {
      const value = parseFloat(timeMatch[1]);
      let from = timeMatch[2].toLowerCase().replace(/s$/, '') as TimeUnit;
      let to = timeMatch[3].toLowerCase().replace(/s$/, '') as TimeUnit;
      
      // Make sure the units are valid
      if (!timeUnits[from]) from = 'seconds';
      if (!timeUnits[to]) to = 'seconds';
      
      return convertTime(value, from, to);
    }
    
    // Regular calculation
    // Remove all whitespace
    expression = expression.replace(/\s+/g, '');
    
    // Replace × with * and ÷ with /
    expression = expression.replace(/×/g, '*').replace(/÷/g, '/');
    
    try {
      // Using Function instead of eval for better security
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expression)();
      
      if (isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid calculation');
      }
      
      return result;
    } catch (error) {
      throw new Error('Invalid expression');
    }
  };
  
  const convertCurrency = (value: number, from: CurrencyCode, to: CurrencyCode): number => {
    if (!exchangeRates[from] || !exchangeRates[to]) {
      throw new Error('Unknown currency');
    }
    
    // Convert to USD first (base currency)
    const valueInUSD = value / exchangeRates[from];
    
    // Convert from USD to target currency
    return valueInUSD * exchangeRates[to];
  };

  const convertTime = (value: number, from: TimeUnit, to: TimeUnit): number => {
    if (!timeUnits[from] || !timeUnits[to]) {
      throw new Error('Unknown time unit');
    }
    
    // Convert to seconds first
    const valueInSeconds = value * timeUnits[from];
    
    // Convert from seconds to target unit
    return valueInSeconds / timeUnits[to];
  };
  
  const handleCurrencyConversion = () => {
    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      const value = parseFloat(amount);
      const converted = convertCurrency(value, fromCurrency, toCurrency);
      setConvertedAmount(converted.toFixed(2));
      
      // Add to history
      const conversionString = `${amount} ${fromCurrency} to ${toCurrency}`;
      setHistory(prev => [
        { input: conversionString, result: converted.toFixed(2) },
        ...prev.slice(0, 9)
      ]);
      
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setConvertedAmount(null);
    }
  };

  const calculateTimeDifference = () => {
    try {
      if (!date1 || !date2) {
        setError('Please enter both dates');
        return;
      }
      
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        setError('Invalid date format');
        return;
      }
      
      // Calculate difference in milliseconds
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      
      // Convert to various units
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      const result = `${diffDays} days, ${diffHours % 24} hours, ${diffMinutes % 60} minutes, ${diffSeconds % 60} seconds`;
      setTimeResult(result);
      
      // Add to history
      const operation = `Time diff: ${date1} to ${date2}`;
      setHistory(prev => [
        { input: operation, result },
        ...prev.slice(0, 9)
      ]);
      
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setTimeResult(null);
    }
  };

  const calculateTimeConversion = () => {
    try {
      if (!timeAmount || isNaN(Number(timeAmount))) {
        setError('Please enter a valid amount');
        return;
      }
      
      const value = parseFloat(timeAmount);
      const converted = convertTime(value, fromTimeUnit, toTimeUnit);
      
      // Format the result
      let formattedResult: string;
      if (converted >= 1000000) {
        formattedResult = converted.toExponential(2);
      } else if (converted >= 1000) {
        formattedResult = converted.toLocaleString(undefined, { maximumFractionDigits: 2 });
      } else {
        formattedResult = converted.toFixed(2);
      }
      
      setTimeResult(formattedResult);
      
      // Add to history
      const operation = `${timeAmount} ${fromTimeUnit} to ${toTimeUnit}`;
      setHistory(prev => [
        { input: operation, result: formattedResult },
        ...prev.slice(0, 9)
      ]);
      
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setTimeResult(null);
    }
  };

  const calculateTimeAddSubtract = () => {
    try {
      if (!date1 || !timeAmount || isNaN(Number(timeAmount))) {
        setError('Please enter a valid date and amount');
        return;
      }
      
      const d1 = new Date(date1);
      
      if (isNaN(d1.getTime())) {
        setError('Invalid date format');
        return;
      }
      
      const value = parseFloat(timeAmount);
      const valueInMs = value * timeUnits[fromTimeUnit] * 1000;
      
      let newDate: Date;
      if (addSubtract === 'add') {
        newDate = new Date(d1.getTime() + valueInMs);
      } else {
        newDate = new Date(d1.getTime() - valueInMs);
      }
      
      // Format the result date
      const result = newDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      setTimeResult(result);
      
      // Add to history
      const operation = `${date1} ${addSubtract === 'add' ? '+' : '-'} ${timeAmount} ${fromTimeUnit}`;
      setHistory(prev => [
        { input: operation, result },
        ...prev.slice(0, 9)
      ]);
      
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setTimeResult(null);
    }
  };
  
  const handleTimeCalculation = () => {
    setError(null);
    
    switch (timeCalcMode) {
      case 'diff':
        calculateTimeDifference();
        break;
      case 'convert':
        calculateTimeConversion();
        break;
      case 'add':
        calculateTimeAddSubtract();
        break;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showTimeCalculator) {
        setShowTimeCalculator(false);
        setShowCurrencyConverter(false);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 0);
      } else if (showCurrencyConverter) {
        setShowCurrencyConverter(false);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 0);
      } else if (input) {
        setInput('');
        setResult(null);
        setError(null);
      } else {
        onViewChange('command');
      }
    } else if (e.key === 'Enter') {
      if (input) {
        try {
          const calculatedResult = calculate(input).toString();
          setResult(calculatedResult);
          setError(null);
          
          // Add to history
          setHistory(prev => [
            { input, result: calculatedResult },
            ...prev.slice(0, 9) // Keep last 10 items
          ]);
        } catch (err) {
          setError((err as Error).message);
          setResult(null);
        }
      }
    } else if (e.key === 'ArrowUp' && history.length > 0 && showHistory) {
      e.preventDefault();
      // Select the first history item
      setInput(history[0].input);
    }
  };
  
  const copyToClipboard = (text: string) => {
    // Try to use electron's clipboard if available
    if (typeof window !== 'undefined' && window.electron?.clipboard?.writeText) {
      window.electron.clipboard.writeText(text);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleCalculatorButtonClick = (value: string) => {
    if (value === '=') {
      // Trigger calculation
      try {
        const calculatedResult = calculate(input).toString();
        setResult(calculatedResult);
        setError(null);
        
        // Add to history
        setHistory(prev => [
          { input, result: calculatedResult },
          ...prev.slice(0, 9) // Keep last 10 items
        ]);
      } catch (err) {
        setError((err as Error).message);
        setResult(null);
      }
    } else if (value === 'C') {
      // Clear current input
      setInput('');
      setResult(null);
      setError(null);
    } else if (value === '⌫') {
      // Backspace
      setInput(prev => prev.slice(0, -1));
    } else {
      // Append to input
      setInput(prev => prev + value);
    }
  };

  const calculatorButtons = [
    ['(', ')', '%', 'C'],
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
    ['⌫']
  ];

  // Helper function to get timezone offset in minutes
  const getTimezoneOffset = (tzAbbr: string): number => {
    const tzOffsets: Record<string, number> = {
      'EST': -300, // Eastern Standard Time (UTC-5)
      'EDT': -240, // Eastern Daylight Time (UTC-4)
      'CST': -360, // Central Standard Time (UTC-6)
      'CDT': -300, // Central Daylight Time (UTC-5)
      'MST': -420, // Mountain Standard Time (UTC-7)
      'MDT': -360, // Mountain Daylight Time (UTC-6)
      'PST': -480, // Pacific Standard Time (UTC-8)
      'PDT': -420, // Pacific Daylight Time (UTC-7)
      'GMT': 0,    // Greenwich Mean Time (UTC+0)
      'BST': 60,   // British Summer Time (UTC+1)
      'UTC': 0,    // Coordinated Universal Time (UTC+0)
      'IST': 330,  // Indian Standard Time (UTC+5:30)
      'JST': 540,  // Japan Standard Time (UTC+9)
      'AEST': 600, // Australian Eastern Standard Time (UTC+10)
      'AEDT': 660, // Australian Eastern Daylight Time (UTC+11)
      'CET': 60,   // Central European Time (UTC+1)
      'CEST': 120  // Central European Summer Time (UTC+2)
    };
    
    return tzOffsets[tzAbbr] || 0;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <CalculatorIcon className="h-5 w-5 text-blue-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder={showCurrencyConverter || showTimeCalculator ? "Switch back to calculator with tab button" : "Enter calculation or '100 USD to EUR' or '2 hours in minutes'..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={showCurrencyConverter || showTimeCalculator}
          />
        </div>
      </div>

      <div className="px-4 pb-2 flex justify-between">
        <button
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            !showCurrencyConverter && !showTimeCalculator
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          onClick={() => {
            setShowCurrencyConverter(false);
            setShowTimeCalculator(false);
            setTimeout(() => {
              if (inputRef.current) inputRef.current.focus();
            }, 0);
          }}
        >
          <div className="flex items-center">
            <CalculatorIcon className="h-3 w-3 mr-1" />
            <span>Calculator</span>
          </div>
        </button>
        <button
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            showCurrencyConverter 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          onClick={() => {
            setShowCurrencyConverter(true);
            setShowTimeCalculator(false);
          }}
        >
          <div className="flex items-center">
            <Globe className="h-3 w-3 mr-1" />
            <span>Currency</span>
          </div>
        </button>
        <button
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            showTimeCalculator 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          onClick={() => {
            setShowTimeCalculator(true);
            setShowCurrencyConverter(false);
          }}
        >
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Time</span>
          </div>
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full p-4">
        {showTimeCalculator ? (
          // Time calculator interface
          <div className="flex flex-col h-full">
            <div className="mb-4 flex space-x-2">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  timeCalcMode === 'diff' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setTimeCalcMode('diff')}
              >
                <div className="flex items-center justify-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Time Difference</span>
                </div>
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  timeCalcMode === 'convert' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setTimeCalcMode('convert')}
              >
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  <span>Convert Units</span>
                </div>
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  timeCalcMode === 'add' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setTimeCalcMode('add')}
              >
                <div className="flex items-center justify-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Add/Subtract</span>
                </div>
              </button>
            </div>
            
            {timeCalcMode === 'diff' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">End Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                    value={date2}
                    onChange={(e) => setDate2(e.target.value)}
                  />
                </div>
              </>
            )}
            
            {timeCalcMode === 'convert' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                    value={timeAmount}
                    onChange={(e) => setTimeAmount(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">From</label>
                    <select 
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                      value={fromTimeUnit}
                      onChange={(e) => setFromTimeUnit(e.target.value as TimeUnit)}
                    >
                      {Object.keys(timeUnits).map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">To</label>
                    <select 
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                      value={toTimeUnit}
                      onChange={(e) => setToTimeUnit(e.target.value as TimeUnit)}
                    >
                      {Object.keys(timeUnits).map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
            
            {timeCalcMode === 'add' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2 mb-4">
                  <button
                    className={`flex-1 py-2 rounded-md transition-colors ${
                      addSubtract === 'add' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => setAddSubtract('add')}
                  >
                    Add
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-md transition-colors ${
                      addSubtract === 'subtract' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => setAddSubtract('subtract')}
                  >
                    Subtract
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Amount</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                      value={timeAmount}
                      onChange={(e) => setTimeAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Unit</label>
                    <select 
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                      value={fromTimeUnit}
                      onChange={(e) => setFromTimeUnit(e.target.value as TimeUnit)}
                    >
                      {Object.keys(timeUnits).map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
            
            <button
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center mb-4"
              onClick={handleTimeCalculation}
            >
              <Clock className="h-4 w-4 mr-2" />
              Calculate
            </button>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-md mb-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            {timeResult && (
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <div className="pr-2">
                    <p className="text-sm text-gray-400">Result:</p>
                    <p className="text-lg font-semibold text-white break-words">{timeResult}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(timeResult)}
                    className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white flex-shrink-0"
                    title="Copy result"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              <p className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Time calculation features support different operations.</p>
              <p className="mt-1">You can also type calculations like "2 hours in minutes" in the calculator.</p>
            </div>
          </div>
        ) : showCurrencyConverter ? (
          // Currency converter interface
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">From</label>
                <select 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
                >
                  {Object.keys(exchangeRates).map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">To</label>
                <select 
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
                >
                  {Object.keys(exchangeRates).map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center mb-4"
              onClick={handleCurrencyConversion}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Convert
            </button>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-md mb-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            {convertedAmount && (
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">{amount} {fromCurrency} =</p>
                    <p className="text-xl font-semibold text-white">{convertedAmount} {toCurrency}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(`${convertedAmount} ${toCurrency}`)}
                    className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                    title="Copy result"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              <p className="flex items-center"><Globe className="h-3 w-3 mr-1" /> Exchange rates are for demonstration purposes only.</p>
              <p className="mt-1">You can also type calculations like "100 USD to EUR" in the calculator.</p>
              <p className="mt-1 text-gray-400 italic">Future enhancement: Online currency conversion API for real-time rates.</p>
            </div>
          </div>
        ) : (
          // Standard calculator interface
          <>
            {/* Result area */}
            {(result || error) && (
              <div className={`p-4 mb-4 rounded-lg ${error ? 'bg-red-900/30 border border-red-700' : 'bg-blue-900/30 border border-blue-700'}`}>
                {error ? (
                  <p className="text-red-400">{error}</p>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">{input} =</p>
                      <p className="text-xl font-semibold text-white">{result}</p>
                    </div>
                    <button 
                      onClick={() => result && copyToClipboard(result)}
                      className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                      title="Copy result"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Calculator pad */}
            <div className="grid grid-cols-4 gap-2 mt-auto">
              {calculatorButtons.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map((button) => (
                    <button
                      key={button}
                      className={`p-3 rounded-lg ${
                        button === '=' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold' 
                          : ['C', '⌫'].includes(button)
                          ? 'bg-red-700/50 hover:bg-red-700 text-white'
                          : ['(', ')', '%', '÷', '×', '-', '+'].includes(button)
                          ? 'bg-gray-700 hover:bg-gray-600 text-blue-400'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      } transition-colors`}
                      onClick={() => handleCalculatorButtonClick(button)}
                    >
                      {button}
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        {/* History toggle button */}
        <button 
          className="mt-4 text-sm text-gray-400 hover:text-white"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>

        {/* History list */}
        {showHistory && history.length > 0 && (
          <div className="mt-2 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-2 bg-gray-800 text-xs text-gray-400 flex justify-between">
              <span>Calculation history</span>
              <button 
                className="hover:text-white"
                onClick={() => setHistory([])}
              >
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {history.map((item, index) => (
                <div 
                  key={index} 
                  className="p-2 border-t border-gray-800 hover:bg-gray-800 cursor-pointer"
                  onClick={() => setInput(item.input)}
                >
                  <p className="text-xs text-gray-400">{item.input}</p>
                  <p className="text-sm">{item.result}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 bg-gray-900 text-xs text-gray-500 flex justify-between">
        <span>Calculator, Currency & Time Converter</span>
        <span>Enter to calculate | Esc to clear/exit</span>
      </div>
    </div>
  );
} 