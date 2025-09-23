import React from 'react';
import { PasswordStrength } from './types';
import { getPasswordStrengthColor, getPasswordStrengthText } from './utils';
import { motion } from 'motion/react';

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
  password: string;
}

export function PasswordStrengthMeter({ strength, password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className="h-1 flex-1 rounded-full bg-muted"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                index < strength.score ? getPasswordStrengthColor(strength.score) : ''
              }`}
              initial={{ width: 0 }}
              animate={{ width: index < strength.score ? '100%' : '0%' }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Strength text and feedback */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          strength.score <= 1 ? 'text-red-600' :
          strength.score === 2 ? 'text-yellow-600' :
          strength.score === 3 ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {getPasswordStrengthText(strength.score)}
        </span>
        
        {strength.feedback.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {strength.feedback.length} requirement{strength.feedback.length !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>

      {/* Feedback list */}
      {strength.feedback.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-muted-foreground space-y-1"
        >
          {strength.feedback.map((item, index) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              {item}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}