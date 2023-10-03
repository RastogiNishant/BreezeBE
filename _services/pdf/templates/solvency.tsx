import { StyleSheet, View, Text, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
  },
  header: {
    marginTop: '8px',
    height: 19,
    backgroundColor: '#F6FCFC',
    color: '#00ACD4',
    borderRadius: '5px',
    paddingLeft: '7px',
    fontSize: '10px',
    paddingTop: '3px',
    fontFamily: 'Montserrat',
    fontWeight: 700,
    width: '33%',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '5px',
  },
  leftSection: {
    flex: '0 0 33%',
  },
  rightSection: {
    flexDirection: 'row',
    flex: '0 0 67%',
    marginLeft: '7.5px',
  },
  label: {
    textTransform: 'uppercase',
  },
  icon: {
    maxWidth: 20,
    margin: 'auto',
    padding: 0,
  },
  margin: {
    marginLeft: 10,
  },
  top: {
    width: 100,
    height: '15px',
    backgroundColor: '#F6FCFC',
    borderRadius: '3px',
  },
  isRed: {
    color: '#E56161',
  },
  isBold: {
    fontWeight: 600,
  },
  rowWrapper: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginRight: '7.5px',
    borderRadius: '5px',
  },
  textWrapper: {
    backgroundColor: '#F6FCFC',
    borderRadius: '5px',
    marginBottom: '5px',
    height: 15,
    fontWeight: 'light',
    color: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    marginLeft: '7px',
    fontSize: '7px',
    marginTop: '1px',
  },
  lightBlack: {
    color: '#434343',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: '6px',
    fontStyle: 'italic',
  },
  pageIcon: {
    width: '8px',
    marginRight: '7px',
    marginLeft: '4px',
  },
  subSection: {
    marginRight: '6px',
    width: '100%',
  },
  isUnderline: {
    textDecoration: 'underline',
  },
  upperCase: {
    textTransform: 'uppercase',
  },
  creditHistory: {
    height: 23,
  },
});

const Solvency = ({
  solvencyHeader,
  unpaidRental,
  execution,
  insolvency,
  cleanOut,
  wage,
  page,
  score,
  rentArrears,
  solvencyDetails = [],
}: any) => (
  <>
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.upperCase}>{solvencyHeader}</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.leftSection}>
          <View style={styles.rowWrapper}>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{score}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{rentArrears}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{unpaidRental}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{execution}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{insolvency}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{cleanOut}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{wage}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightSection}>
          {!!solvencyDetails && solvencyDetails.length
            ? solvencyDetails?.map((each: any, ind: number) => {
              const creditScoreClasses: any = [styles.textWrapper, styles.iconContainer];
              const creditScoreWrapperClasses: any = [styles.rowText];
              if (each?.creditHistory) {
                creditScoreClasses.push(styles.creditHistory);
              } else {
                creditScoreWrapperClasses.push(styles.isBold);
                creditScoreWrapperClasses.push(styles.isUnderline);
              }
              return (
                <View style={styles.rowWrapper} key={ind}>
                  <View style={creditScoreClasses}>
                    <Text style={creditScoreWrapperClasses}>
                      {!each?.creditHistory ? each?.score : ''}
                      {each?.creditHistory && (
                        <Text style={styles.isBold}>
                          <Text style={styles.isUnderline}>{each?.creditHistory}</Text>
                          {'\n'}
                          <Text
                            style={{
                              fontWeight: 'light',
                              fontSize: '7px',
                            }}
                          >
                            {each?.score + ', ' + each?.creditScoreIssued}
                          </Text>
                        </Text>
                      )}
                    </Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.unpaidRental}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.execution}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.insolvency}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.cleanOut}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.wage}</Text>
                  </View>
                </View>
              );
            })
            : null}
        </View>
      </View>
    </View>
  </>
);

export default Solvency;
